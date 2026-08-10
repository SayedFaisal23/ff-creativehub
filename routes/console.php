<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

Artisan::command('creative:seed', function (): int {
    $this->call('db:seed');

    return self::SUCCESS;
})->purpose('Seed Creative Monitor demo data');

Artisan::command('creative:process-proxies {--limit=5} {--dry-run}', function (): int {
    $limit = max(1, (int) $this->option('limit'));
    $ffmpeg = env('FFMPEG_PATH', 'ffmpeg');

    $assets = DB::table('assets')
        ->where('storage_disk', 'nas')
        ->where('processing_status', 'proxy_needed')
        ->whereNotNull('storage_path')
        ->orderBy('updated_at')
        ->limit($limit)
        ->get();

    if ($assets->isEmpty()) {
        $this->info('No queued proxy jobs found.');

        return self::SUCCESS;
    }

    foreach ($assets as $asset) {
        $sourcePath = safeNasPath((string) $asset->storage_path);
        $proxyPath = safeNasPath((string) ($asset->proxy_path ?: defaultProxyPath($asset)));
        $source = Storage::disk('nas')->path($sourcePath);
        $target = Storage::disk('nas')->path($proxyPath);

        if ($this->option('dry-run')) {
            $missing = is_file($source) ? '' : ' (source missing)';
            $this->line("Would create {$proxyPath} from {$sourcePath}{$missing}");
            continue;
        }

        if (! is_file($source)) {
            markProxyFailed($asset, "Source file missing: {$sourcePath}");
            $this->warn("Skipped {$asset->name}: source file missing.");
            continue;
        }

        Storage::disk('nas')->makeDirectory(dirname($proxyPath));
        DB::table('assets')->where('id', $asset->id)->update([
            'processing_status' => 'proxy_processing',
            'proxy_path' => $proxyPath,
            'updated_at' => now(),
        ]);

        $process = new Process([
            $ffmpeg,
            '-y',
            '-i',
            $source,
            '-vf',
            "scale='min(1280,iw)':-2",
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '28',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            '-movflags',
            '+faststart',
            $target,
        ]);
        $process->setTimeout(3600);
        $process->run();

        if (! $process->isSuccessful() || ! is_file($target)) {
            markProxyFailed($asset, trim($process->getErrorOutput()) ?: 'FFmpeg did not create a proxy file.');
            $this->error("Failed proxy for {$asset->name}");
            continue;
        }

        DB::table('assets')->where('id', $asset->id)->update([
            'processing_status' => 'proxy_ready',
            'proxy_path' => $proxyPath,
            'preview_path' => $proxyPath,
            'mime_type' => 'video/mp4',
            'updated_at' => now(),
        ]);

        activity($asset->project_id, 'proxy_ready', "Proxy ready for {$asset->name}", 'asset', $asset->id);
        notifyProjectUsers($asset->project_id, 'Proxy ready', "{$asset->name} is ready for browser preview.", 'assets');
        $this->info("Proxy ready: {$proxyPath}");
    }

    return self::SUCCESS;
})->purpose('Generate browser-friendly FFmpeg proxy videos for queued NAS assets');

function safeNasPath(string $path): string
{
    $path = str_replace('\\', '/', trim($path));
    $parts = array_filter(explode('/', $path), fn (string $part) => $part !== '' && $part !== '.' && $part !== '..');

    return implode('/', $parts);
}

function defaultProxyPath(object $asset): string
{
    $project = DB::table('projects')->where('id', $asset->project_id)->first();
    $base = $project?->nas_folder ?: 'projects/'.($project?->code ?: $asset->project_id);
    $name = pathinfo((string) $asset->name, PATHINFO_FILENAME) ?: 'asset';
    $safeName = preg_replace('/[^A-Za-z0-9._ -]+/', '-', $name) ?: 'asset';

    return safeNasPath("{$base}/proxies/{$safeName}_proxy.mp4");
}

function markProxyFailed(object $asset, string $message): void
{
    DB::table('assets')->where('id', $asset->id)->update([
        'processing_status' => 'proxy_failed',
        'updated_at' => now(),
    ]);

    activity($asset->project_id, 'proxy_failed', "Proxy failed for {$asset->name}: ".Str::limit($message, 180), 'asset', $asset->id);
    notifyProjectUsers($asset->project_id, 'Proxy failed', "{$asset->name} could not be converted. Check the source file or FFmpeg logs.", 'assets');
}

function activity(?string $projectId, string $type, string $summary, ?string $targetType = null, ?string $targetId = null): void
{
    DB::table('activity_events')->insert([
        'id' => 'act-'.Str::ulid()->toBase32(),
        'project_id' => $projectId,
        'actor' => 'Proxy Worker',
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

function notifyProjectUsers(?string $projectId, string $title, string $message, string $linkView): void
{
    if (! $projectId) {
        return;
    }

    $project = DB::table('projects')->where('id', $projectId)->first();
    if (! $project) {
        return;
    }

    $team = $project->assigned_team_members ? json_decode($project->assigned_team_members, true, 512, JSON_THROW_ON_ERROR) : [];
    $users = array_values(array_unique(array_filter(array_merge([$project->assigned_manager], $team))));

    foreach ($users as $user) {
        DB::table('notifications')->insert([
            'id' => 'nt-'.Str::ulid()->toBase32(),
            'user' => $user,
            'type' => 'proxy',
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
