<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AssetStorageController
{
    private const CHUNK_SIZE = 8 * 1024 * 1024;

    public function createProjectFolders(Request $request): JsonResponse
    {
        $data = $request->validate([
            'projectId' => ['required', 'string'],
        ]);

        $project = DB::table('projects')->where('id', $data['projectId'])->first();
        abort_if(! $project, 404, 'Project not found.');

        $base = $this->projectFolder($project);
        $folders = ['raw', 'proxies', 'project-files', 'exports', 'briefs', 'references'];

        foreach ($folders as $folder) {
            Storage::disk('nas')->makeDirectory("{$base}/{$folder}");
        }

        DB::table('projects')->where('id', $project->id)->update([
            'nas_folder' => $base,
            'updated_at' => now(),
        ]);

        $this->activity($project->id, 'folders', "NAS folders created for {$project->code}", 'project', $project->id);

        return response()->json([
            'ok' => true,
            'folder' => $base,
            'folders' => array_map(fn (string $folder) => "{$base}/{$folder}", $folders),
        ]);
    }

    public function startChunkedUpload(Request $request): JsonResponse
    {
        $data = $request->validate([
            'projectId' => ['required', 'string'],
            'filename' => ['required', 'string'],
            'totalSize' => ['required', 'integer', 'min:1'],
            'mimeType' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
            'storagePath' => ['nullable', 'string'],
        ]);

        $project = DB::table('projects')->where('id', $data['projectId'])->first();
        abort_if(! $project, 404, 'Project not found.');

        $filename = $this->safeFilename($data['filename']);
        $storagePath = $this->safeRelativePath($data['storagePath'] ?? '');
        if ($storagePath === '') {
            $storagePath = $this->projectFolder($project).'/raw/'.$filename;
        }

        $uploadId = 'up-'.Str::ulid()->toBase32();
        $totalChunks = (int) ceil($data['totalSize'] / self::CHUNK_SIZE);

        Storage::disk('nas')->makeDirectory("tmp/uploads/{$uploadId}");
        DB::table('upload_sessions')->insert([
            'id' => $uploadId,
            'project_id' => $project->id,
            'filename' => $filename,
            'storage_path' => $storagePath,
            'total_size' => $data['totalSize'],
            'total_chunks' => $totalChunks,
            'received_chunks' => json_encode([], JSON_THROW_ON_ERROR),
            'mime_type' => $data['mimeType'] ?? null,
            'category' => $data['category'] ?? 'Raw Footage',
            'status' => 'uploading',
            'created_by' => session('creative_user.name'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->activity($project->id, 'upload_started', "Started upload for {$filename}", 'upload', $uploadId);

        return response()->json([
            'ok' => true,
            'uploadId' => $uploadId,
            'chunkSize' => self::CHUNK_SIZE,
            'totalChunks' => $totalChunks,
            'storagePath' => $storagePath,
        ]);
    }

    public function uploadChunk(Request $request, string $uploadId): JsonResponse
    {
        $data = $request->validate([
            'index' => ['required', 'integer', 'min:0'],
            'chunk' => ['required', 'file'],
        ]);

        $session = DB::table('upload_sessions')->where('id', $uploadId)->first();
        abort_if(! $session, 404, 'Upload session not found.');

        $chunkPath = "tmp/uploads/{$uploadId}/{$data['index']}.part";
        Storage::disk('nas')->put($chunkPath, file_get_contents($data['chunk']->getRealPath()));

        $received = $this->decode($session->received_chunks);
        $received[] = (int) $data['index'];
        $received = array_values(array_unique($received));
        sort($received);

        DB::table('upload_sessions')->where('id', $uploadId)->update([
            'received_chunks' => json_encode($received, JSON_THROW_ON_ERROR),
            'updated_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'received' => count($received),
            'total' => (int) $session->total_chunks,
            'progress' => round((count($received) / max(1, (int) $session->total_chunks)) * 100),
        ]);
    }

    public function completeChunkedUpload(string $uploadId): JsonResponse
    {
        $session = DB::table('upload_sessions')->where('id', $uploadId)->first();
        abort_if(! $session, 404, 'Upload session not found.');

        $received = $this->decode($session->received_chunks);
        abort_if(count($received) < (int) $session->total_chunks, 422, 'Upload is missing chunks.');

        $disk = Storage::disk('nas');
        $disk->makeDirectory(dirname($session->storage_path));
        $target = $disk->path($session->storage_path);
        $out = fopen($target, 'wb');
        abort_if(! $out, 500, 'Unable to write completed file.');

        for ($index = 0; $index < (int) $session->total_chunks; $index += 1) {
            $chunk = $disk->path("tmp/uploads/{$uploadId}/{$index}.part");
            abort_if(! is_file($chunk), 422, "Chunk {$index} is missing.");
            $in = fopen($chunk, 'rb');
            stream_copy_to_stream($in, $out);
            fclose($in);
        }
        fclose($out);

        $assetId = 'as-'.Str::ulid()->toBase32();
        $extension = strtoupper(pathinfo($session->filename, PATHINFO_EXTENSION) ?: 'FILE');
        $now = now();
        $today = $now->toDateString();
        $proxyPath = $this->proxyPath($session->project_id, $session->filename);
        $version = [
            'id' => 'av-'.Str::ulid()->toBase32(),
            'assetId' => $assetId,
            'version' => 1,
            'storagePath' => $session->storage_path,
            'createdBy' => $session->created_by,
            'note' => 'Initial NAS upload',
            'fileSize' => (int) $session->total_size,
            'createdAt' => $today,
        ];

        DB::table('assets')->insert([
            'id' => $assetId,
            'name' => $session->filename,
            'format' => $extension,
            'project_id' => $session->project_id,
            'category' => $session->category,
            'storage_disk' => 'nas',
            'storage_path' => $session->storage_path,
            'original_filename' => $session->filename,
            'file_size' => $session->total_size,
            'mime_type' => $session->mime_type,
            'upload_status' => 'on_nas',
            'processing_status' => 'proxy_needed',
            'proxy_path' => $proxyPath,
            'preview_path' => '',
            'version' => 1,
            'version_history' => json_encode([$version], JSON_THROW_ON_ERROR),
            'tags' => json_encode(['raw-footage'], JSON_THROW_ON_ERROR),
            'status' => 'Pending',
            'downloads' => 0,
            'usage_history' => json_encode([], JSON_THROW_ON_ERROR),
            'created_at_date' => $today,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('asset_versions')->insert([
            'id' => $version['id'],
            'asset_id' => $assetId,
            'version' => 1,
            'storage_path' => $session->storage_path,
            'created_by' => $session->created_by,
            'note' => 'Initial NAS upload',
            'file_size' => $session->total_size,
            'created_at_date' => $today,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('upload_sessions')->where('id', $uploadId)->update([
            'status' => 'completed',
            'updated_at' => $now,
        ]);
        $disk->deleteDirectory("tmp/uploads/{$uploadId}");

        $this->activity($session->project_id, 'upload_completed', "Uploaded {$session->filename} to NAS", 'asset', $assetId);
        $this->notifyProject($session->project_id, 'Raw footage uploaded', "{$session->filename} is on the NAS and needs a proxy.", 'assets');

        return response()->json([
            'ok' => true,
            'asset' => [
                'id' => $assetId,
                'name' => $session->filename,
                'format' => $extension,
                'projectId' => $session->project_id,
                'category' => $session->category,
                'storageDisk' => 'nas',
                'storagePath' => $session->storage_path,
                'originalFilename' => $session->filename,
                'fileSize' => (int) $session->total_size,
                'mimeType' => $session->mime_type ?? '',
                'uploadStatus' => 'on_nas',
                'processingStatus' => 'proxy_needed',
                'proxyPath' => $proxyPath,
                'previewPath' => '',
                'version' => 1,
                'versionHistory' => [$version],
                'tags' => ['raw-footage'],
                'status' => 'Pending',
                'downloads' => 0,
                'usageHistory' => [],
                'createdAt' => $today,
            ],
            'version' => $version,
        ]);
    }

    public function queueProxy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'assetId' => ['required', 'string'],
        ]);

        $asset = DB::table('assets')->where('id', $data['assetId'])->first();
        abort_if(! $asset, 404, 'Asset not found.');

        $proxyPath = $asset->proxy_path ?: $this->proxyPath($asset->project_id, $asset->name);

        DB::table('assets')->where('id', $asset->id)->update([
            'processing_status' => 'proxy_needed',
            'proxy_path' => $proxyPath,
            'updated_at' => now(),
        ]);

        $this->activity($asset->project_id, 'proxy_queued', "Proxy queued for {$asset->name}", 'asset', $asset->id);
        $this->notifyProject($asset->project_id, 'Proxy queued', "{$asset->name} is queued for proxy generation.", 'assets');

        return response()->json([
            'ok' => true,
            'assetId' => $asset->id,
            'processingStatus' => 'proxy_needed',
            'proxyPath' => $proxyPath,
        ]);
    }

    public function stream(string $assetId)
    {
        $asset = DB::table('assets')->where('id', $assetId)->first();
        abort_if(! $asset, 404, 'Asset not found.');

        $path = $asset->preview_path ?: ($asset->proxy_path ?: $asset->storage_path);
        $path = $this->safeRelativePath((string) $path);
        abort_if($path === '' || ! Storage::disk('nas')->exists($path), 404, 'Preview file not found on NAS.');

        return response()->file(Storage::disk('nas')->path($path), [
            'Content-Type' => $asset->mime_type ?: 'application/octet-stream',
        ]);
    }

    private function projectFolder(object $project): string
    {
        if (! empty($project->nas_folder)) {
            return $this->safeRelativePath($project->nas_folder);
        }

        return 'projects/'.$this->safeFilename($project->code.'-'.$project->name);
    }

    private function proxyPath(string $projectId, string $filename): string
    {
        $project = DB::table('projects')->where('id', $projectId)->first();
        $base = $project ? $this->projectFolder($project) : "projects/{$projectId}";
        $name = pathinfo($filename, PATHINFO_FILENAME);

        return $base.'/proxies/'.$this->safeFilename($name.'_proxy.mp4');
    }

    private function safeRelativePath(string $path): string
    {
        $path = str_replace('\\', '/', trim($path));
        $parts = array_filter(explode('/', $path), fn (string $part) => $part !== '' && $part !== '.' && $part !== '..');

        return implode('/', array_map(fn (string $part) => $this->safeFilename($part), $parts));
    }

    private function safeFilename(string $name): string
    {
        $name = preg_replace('/[^A-Za-z0-9._ -]+/', '-', $name) ?: 'file';
        $name = preg_replace('/\s+/', ' ', trim($name)) ?: 'file';

        return trim($name, '. ');
    }

    private function decode(?string $value): array
    {
        if (! $value) {
            return [];
        }

        return json_decode($value, true, 512, JSON_THROW_ON_ERROR) ?: [];
    }

    private function activity(?string $projectId, string $type, string $summary, ?string $targetType = null, ?string $targetId = null): void
    {
        DB::table('activity_events')->insert([
            'id' => 'act-'.Str::ulid()->toBase32(),
            'project_id' => $projectId,
            'actor' => session('creative_user.name', 'System'),
            'type' => $type,
            'summary' => $summary,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'metadata' => json_encode([], JSON_THROW_ON_ERROR),
            'created_at_date' => now()->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function notifyProject(string $projectId, string $title, string $message, string $linkView): void
    {
        $project = DB::table('projects')->where('id', $projectId)->first();
        if (! $project) {
            return;
        }

        $users = array_filter(array_unique(array_merge(
            [$project->assigned_manager],
            $this->decode($project->assigned_team_members)
        )));

        foreach ($users as $user) {
            DB::table('notifications')->insert([
                'id' => 'nt-'.Str::ulid()->toBase32(),
                'user' => $user,
                'type' => 'asset_workflow',
                'title' => $title,
                'message' => $message,
                'link_view' => $linkView,
                'read' => false,
                'created_at_date' => now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
