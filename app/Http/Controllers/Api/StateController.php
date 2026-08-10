<?php

namespace App\Http\Controllers\Api;

use App\Support\CreativeMonitorSeed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class StateController
{
    private const REMOVED_DEMO_USER_EMAILS = [
        'approver@example.com',
        'audio@example.com',
        'final.verifier@example.com',
        'motion@example.com',
        'production@example.com',
        'publisher@example.com',
        'script.checker@example.com',
        'verifier@example.com',
    ];

    private const REMOVED_DEMO_USER_IDS = [
        'app-1',
        'aud-1',
        'fv-1',
        'des-1',
        'prod-1',
        'pub-1',
        'chk-1',
        'ver-1',
    ];

    public function show(): JsonResponse
    {
        return response()->json($this->readState());
    }

    public function update(Request $request): JsonResponse
    {
        $state = $request->all();

        DB::transaction(fn () => $this->persist($state));

        return response()->json([
            'ok' => true,
            'state' => $this->readState(),
        ]);
    }

    public function reset(): JsonResponse
    {
        DB::transaction(fn () => $this->persist(CreativeMonitorSeed::state()));

        return response()->json([
            'ok' => true,
            'state' => $this->readState(),
        ]);
    }

    private function readState(): array
    {
        $auth = session('creative_user');
        $ui = $this->setting('ui', CreativeMonitorSeed::state()['ui']);
        if ($auth) {
            $landingView = session()->pull('creative_landing_view');
            $ui['currentUser'] = $auth['name'];
            $ui['currentRole'] = $auth['role'];
            $ui['view'] = $landingView ?: ($this->canRoleOpenView($auth['role'], $ui['view'] ?? null)
                ? ($ui['view'] ?? $auth['defaultView'])
                : $auth['defaultView']);
        }

        return [
            'auth' => $auth,
            'ui' => $ui,
            'settings' => $this->setting('settings', CreativeMonitorSeed::state()['settings']),
            'projects' => DB::table('projects')->orderBy('deadline')->get()->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'code' => $row->code,
                'client' => $row->client,
                'department' => $row->department,
                'campaign' => $row->campaign,
                'type' => $row->type,
                'priority' => $row->priority,
                'status' => $row->status,
                'description' => $row->description,
                'objectives' => $row->objectives,
                'targetAudience' => $row->target_audience,
                'platform' => $row->platform,
                'budget' => (float) $row->budget,
                'assignedManager' => $row->assigned_manager,
                'assignedTeamMembers' => $this->decode($row->assigned_team_members),
                'internalNotes' => $row->internal_notes,
                'clientNotes' => $row->client_notes,
                'startDate' => (string) $row->start_date,
                'deadline' => (string) $row->deadline,
                'expectedCompletion' => (string) $row->expected_completion,
                'actualCompletion' => (string) $row->actual_completion,
                'estimatedHours' => (int) $row->estimated_hours,
                'actualHours' => (int) $row->actual_hours,
                'workflowStage' => $row->workflow_stage,
                'tags' => $this->decode($row->tags),
                'categories' => $this->decode($row->categories),
                'milestones' => $this->decode($row->milestones),
                'deliverables' => $this->decode($row->deliverables),
                'creativeBrief' => $this->decode($row->creative_brief),
                'nasFolder' => $row->nas_folder ?? '',
                'accessMembers' => $this->decode($row->access_members ?? null),
            ])->values()->all(),
            'tasks' => DB::table('tasks')->orderBy('due_date')->get()->map(fn ($row) => [
                'id' => $row->id,
                'projectId' => $row->project_id,
                'name' => $row->name,
                'description' => $row->description,
                'priority' => $row->priority,
                'assignee' => $row->assignee,
                'reviewer' => $row->reviewer,
                'dueDate' => (string) $row->due_date,
                'startDate' => (string) $row->start_date,
                'completionDate' => (string) $row->completion_date,
                'estimatedHours' => (int) $row->estimated_hours,
                'actualHours' => (int) $row->actual_hours,
                'checklist' => $this->decode($row->checklist),
                'attachments' => $this->decode($row->attachments),
                'comments' => $this->decode($row->comments),
                'dependencies' => $this->decode($row->dependencies),
                'revisionCount' => (int) $row->revision_count,
                'status' => $row->status,
                'stage' => $row->stage,
                'progressPercent' => (int) ($row->progress_percent ?? 0),
                'lastProgressNote' => $row->last_progress_note ?? '',
                'lastProgressAt' => (string) ($row->last_progress_at ?? ''),
            ])->values()->all(),
            'notifications' => DB::table('notifications')->orderByDesc('created_at')->limit(250)->get()->map(fn ($row) => [
                'id' => $row->id,
                'user' => $row->user,
                'type' => $row->type,
                'title' => $row->title,
                'message' => $row->message,
                'linkView' => $row->link_view,
                'read' => (bool) $row->read,
                'createdAt' => (string) $row->created_at_date,
            ])->values()->all(),
            'approvals' => DB::table('approvals')->orderBy('due_date')->get()->map(fn ($row) => [
                'id' => $row->id,
                'projectId' => $row->project_id,
                'deliverable' => $row->deliverable,
                'level' => $row->level,
                'approver' => $row->approver,
                'status' => $row->status,
                'dueDate' => (string) $row->due_date,
                'notes' => $row->notes,
                'comments' => $this->decode($row->comments),
            ])->values()->all(),
            'equipment' => DB::table('equipment')->orderBy('name')->get()->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'type' => $row->type,
                'serialNumber' => $row->serial_number,
                'condition' => $row->condition,
                'availability' => $row->availability,
                'currentUser' => $row->current_user,
                'returnDate' => (string) $row->return_date,
                'maintenanceDate' => (string) $row->maintenance_date,
                'warrantyDate' => (string) $row->warranty_date,
                'purchaseDate' => (string) $row->purchase_date,
                'replacementDate' => (string) $row->replacement_date,
                'bookingHistory' => $this->decode($row->booking_history),
            ])->values()->all(),
            'assets' => DB::table('assets')->orderByDesc('updated_at')->get()->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'format' => $row->format,
                'projectId' => $row->project_id,
                'category' => $row->category,
                'storageDisk' => $row->storage_disk ?? 'nas',
                'storagePath' => $row->storage_path ?? '',
                'originalFilename' => $row->original_filename ?? '',
                'fileSize' => (int) ($row->file_size ?? 0),
                'mimeType' => $row->mime_type ?? '',
                'uploadStatus' => $row->upload_status ?? 'metadata_only',
                'processingStatus' => $row->processing_status ?? 'not_started',
                'proxyPath' => $row->proxy_path ?? '',
                'previewPath' => $row->preview_path ?? '',
                'versionHistory' => $this->decode($row->version_history ?? null),
                'version' => (int) $row->version,
                'tags' => $this->decode($row->tags),
                'status' => $row->status,
                'downloads' => (int) $row->downloads,
                'usageHistory' => $this->decode($row->usage_history),
                'createdAt' => (string) $row->created_at_date,
            ])->values()->all(),
            'team' => DB::table('users')->orderBy('name')->get()->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'email' => $row->email,
                'title' => $row->title,
                'department' => $row->department,
                'role' => $row->role,
                'utilization' => (int) $row->utilization,
                'skills' => $this->decode($row->skills),
            ])->values()->all(),
            'announcements' => DB::table('announcements')->orderByDesc('date')->get()->map(fn ($row) => [
                'id' => $row->id,
                'title' => $row->title,
                'body' => $row->body,
                'date' => (string) $row->date,
                'owner' => $row->owner,
            ])->values()->all(),
            'audit' => DB::table('audit_logs')->orderByDesc('created_at')->limit(250)->get()->map(fn ($row) => [
                'id' => $row->id,
                'actor' => $row->actor,
                'action' => $row->action,
                'detail' => $row->detail,
                'date' => (string) $row->date,
            ])->values()->all(),
            'comments' => DB::table('project_comments')->orderByDesc('created_at')->limit(500)->get()->map(fn ($row) => [
                'id' => $row->id,
                'projectId' => $row->project_id,
                'taskId' => $row->task_id,
                'assetId' => $row->asset_id,
                'author' => $row->author,
                'body' => $row->body,
                'mentions' => $this->decode($row->mentions),
                'createdAt' => (string) $row->created_at_date,
            ])->values()->all(),
            'activity' => DB::table('activity_events')->orderByDesc('created_at')->limit(500)->get()->map(fn ($row) => [
                'id' => $row->id,
                'projectId' => $row->project_id,
                'actor' => $row->actor,
                'type' => $row->type,
                'summary' => $row->summary,
                'targetType' => $row->target_type,
                'targetId' => $row->target_id,
                'metadata' => $this->decode($row->metadata),
                'createdAt' => (string) $row->created_at_date,
            ])->values()->all(),
            'assetVersions' => DB::table('asset_versions')->orderByDesc('version')->get()->map(fn ($row) => [
                'id' => $row->id,
                'assetId' => $row->asset_id,
                'version' => (int) $row->version,
                'storagePath' => $row->storage_path,
                'createdBy' => $row->created_by,
                'note' => $row->note,
                'fileSize' => (int) $row->file_size,
                'createdAt' => (string) $row->created_at_date,
            ])->values()->all(),
            'workflowWeightage' => $this->setting('workflowWeightage', CreativeMonitorSeed::state()['workflowWeightage'] ?? []),
            'videos' => $this->setting('videos', CreativeMonitorSeed::state()['videos'] ?? []),
            'qcRemarks' => $this->setting('qcRemarks', CreativeMonitorSeed::state()['qcRemarks'] ?? []),
        ];
    }

    private function persist(array $state): void
    {
        $now = now();
        $existingUserPasswords = Schema::hasColumn('users', 'password')
            ? DB::table('users')->pluck('password', 'id')->all()
            : [];

        DB::table('creative_settings')->upsert([
            ['key' => 'ui', 'value' => $this->encode($state['ui'] ?? []), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'settings', 'value' => $this->encode($state['settings'] ?? []), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'workflowWeightage', 'value' => $this->encode($state['workflowWeightage'] ?? []), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'videos', 'value' => $this->encode($state['videos'] ?? []), 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'qcRemarks', 'value' => $this->encode($state['qcRemarks'] ?? []), 'created_at' => $now, 'updated_at' => $now],
        ], ['key'], ['value', 'updated_at']);

        DB::table('departments')->delete();
        foreach (($state['departments'] ?? $this->defaultDepartments()) as $department) {
            DB::table('departments')->insert([
                'name' => $department,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $team = $this->activeTeam($state['team'] ?? []);

        $this->replace('projects', $state['projects'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'name' => $item['name'] ?? 'Untitled Project',
            'code' => $item['code'] ?? $item['id'],
            'client' => $item['client'] ?? null,
            'department' => $item['department'] ?? null,
            'campaign' => $item['campaign'] ?? null,
            'type' => $item['type'] ?? null,
            'priority' => $item['priority'] ?? null,
            'status' => $item['status'] ?? null,
            'description' => $item['description'] ?? null,
            'objectives' => $item['objectives'] ?? null,
            'target_audience' => $item['targetAudience'] ?? null,
            'platform' => $item['platform'] ?? null,
            'budget' => $item['budget'] ?? 0,
            'assigned_manager' => $item['assignedManager'] ?? null,
            'assigned_team_members' => $this->encode($item['assignedTeamMembers'] ?? []),
            'internal_notes' => $item['internalNotes'] ?? null,
            'client_notes' => $item['clientNotes'] ?? null,
            'start_date' => $this->dateOrNull($item['startDate'] ?? null),
            'deadline' => $this->dateOrNull($item['deadline'] ?? null),
            'expected_completion' => $this->dateOrNull($item['expectedCompletion'] ?? null),
            'actual_completion' => $this->dateOrNull($item['actualCompletion'] ?? null),
            'estimated_hours' => $item['estimatedHours'] ?? 0,
            'actual_hours' => $item['actualHours'] ?? 0,
            'workflow_stage' => $this->normalizeWorkflowStage($item['workflowStage'] ?? null),
            'tags' => $this->encode($item['tags'] ?? []),
            'categories' => $this->encode($item['categories'] ?? []),
            'milestones' => $this->encode($item['milestones'] ?? []),
            'deliverables' => $this->encode($item['deliverables'] ?? []),
            'creative_brief' => $this->encode($item['creativeBrief'] ?? []),
            'nas_folder' => $item['nasFolder'] ?? null,
            'access_members' => $this->encode($item['accessMembers'] ?? $item['assignedTeamMembers'] ?? []),
        ]);

        $tasks = array_map(fn ($item) => $this->normalizeTaskAssignment($item, $team), $state['tasks'] ?? []);

        $this->replace('tasks', $tasks, fn ($item) => [
            'id' => $item['id'],
            'project_id' => $item['projectId'] ?? '',
            'name' => $item['name'] ?? 'Untitled Task',
            'description' => $item['description'] ?? null,
            'priority' => $item['priority'] ?? null,
            'assignee' => $item['assignee'] ?? null,
            'reviewer' => $item['reviewer'] ?? null,
            'due_date' => $this->dateOrNull($item['dueDate'] ?? null),
            'start_date' => $this->dateOrNull($item['startDate'] ?? null),
            'completion_date' => $this->dateOrNull($item['completionDate'] ?? null),
            'estimated_hours' => $item['estimatedHours'] ?? 0,
            'actual_hours' => $item['actualHours'] ?? 0,
            'checklist' => $this->encode($item['checklist'] ?? []),
            'attachments' => $this->encode($item['attachments'] ?? []),
            'comments' => $this->encode($item['comments'] ?? []),
            'dependencies' => $this->encode($item['dependencies'] ?? []),
            'revision_count' => $item['revisionCount'] ?? 0,
            'status' => $item['status'] ?? null,
            'stage' => $this->normalizeWorkflowStage($item['stage'] ?? null),
            'progress_percent' => $item['progressPercent'] ?? 0,
            'last_progress_note' => $item['lastProgressNote'] ?? null,
            'last_progress_at' => $this->dateOrNull($item['lastProgressAt'] ?? null),
        ]);

        $this->replace('notifications', $state['notifications'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'user' => $item['user'] ?? null,
            'type' => $item['type'] ?? null,
            'title' => $item['title'] ?? 'Notification',
            'message' => $item['message'] ?? null,
            'link_view' => $item['linkView'] ?? null,
            'read' => (bool) ($item['read'] ?? false),
            'created_at_date' => $this->dateOrNull($item['createdAt'] ?? null),
        ]);

        $this->replace('approvals', $state['approvals'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'project_id' => $item['projectId'] ?? '',
            'deliverable' => $item['deliverable'] ?? 'Untitled Deliverable',
            'level' => $item['level'] ?? null,
            'approver' => $item['approver'] ?? null,
            'status' => $item['status'] ?? null,
            'due_date' => $this->dateOrNull($item['dueDate'] ?? null),
            'notes' => $item['notes'] ?? null,
            'comments' => $this->encode($item['comments'] ?? []),
        ]);

        $this->replace('equipment', $state['equipment'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'name' => $item['name'] ?? 'Untitled Equipment',
            'type' => $item['type'] ?? null,
            'serial_number' => $item['serialNumber'] ?? null,
            'condition' => $item['condition'] ?? null,
            'availability' => $item['availability'] ?? null,
            'current_user' => $item['currentUser'] ?? null,
            'return_date' => $this->dateOrNull($item['returnDate'] ?? null),
            'maintenance_date' => $this->dateOrNull($item['maintenanceDate'] ?? null),
            'warranty_date' => $this->dateOrNull($item['warrantyDate'] ?? null),
            'purchase_date' => $this->dateOrNull($item['purchaseDate'] ?? null),
            'replacement_date' => $this->dateOrNull($item['replacementDate'] ?? null),
            'booking_history' => $this->encode($item['bookingHistory'] ?? []),
        ]);

        $this->replace('assets', $state['assets'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'name' => $item['name'] ?? 'Untitled Asset',
            'format' => $item['format'] ?? null,
            'project_id' => $item['projectId'] ?? '',
            'category' => $item['category'] ?? null,
            'storage_disk' => $item['storageDisk'] ?? 'nas',
            'storage_path' => $item['storagePath'] ?? null,
            'original_filename' => $item['originalFilename'] ?? $item['name'] ?? null,
            'file_size' => $item['fileSize'] ?? 0,
            'mime_type' => $item['mimeType'] ?? null,
            'upload_status' => $item['uploadStatus'] ?? 'metadata_only',
            'processing_status' => $item['processingStatus'] ?? 'not_started',
            'proxy_path' => $item['proxyPath'] ?? null,
            'preview_path' => $item['previewPath'] ?? null,
            'version_history' => $this->encode($item['versionHistory'] ?? []),
            'version' => $item['version'] ?? 1,
            'tags' => $this->encode($item['tags'] ?? []),
            'status' => $item['status'] ?? null,
            'downloads' => $item['downloads'] ?? 0,
            'usage_history' => $this->encode($item['usageHistory'] ?? []),
            'created_at_date' => $this->dateOrNull($item['createdAt'] ?? null),
        ]);

        $this->replace('users', $team, fn ($item) => [
            'id' => $item['id'],
            'name' => $item['name'] ?? 'Unnamed User',
            'email' => $item['email'] ?? null,
            'password' => $existingUserPasswords[$item['id']] ?? Hash::make($item['password'] ?? 'password'),
            'title' => $item['title'] ?? null,
            'department' => $item['department'] ?? null,
            'role' => $item['role'] ?? null,
            'utilization' => $item['utilization'] ?? 0,
            'skills' => $this->encode($item['skills'] ?? []),
        ]);

        $this->replace('announcements', $state['announcements'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'title' => $item['title'] ?? 'Untitled Announcement',
            'body' => $item['body'] ?? null,
            'date' => $this->dateOrNull($item['date'] ?? null),
            'owner' => $item['owner'] ?? null,
        ]);

        $this->replace('audit_logs', $state['audit'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'actor' => $item['actor'] ?? null,
            'action' => $item['action'] ?? 'Activity',
            'detail' => $item['detail'] ?? null,
            'date' => $this->dateOrNull($item['date'] ?? null),
        ]);

        $this->replace('project_comments', $state['comments'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'project_id' => $item['projectId'] ?? '',
            'task_id' => $item['taskId'] ?? null,
            'asset_id' => $item['assetId'] ?? null,
            'author' => $item['author'] ?? null,
            'body' => $item['body'] ?? '',
            'mentions' => $this->encode($item['mentions'] ?? []),
            'created_at_date' => $this->dateOrNull($item['createdAt'] ?? null),
        ]);

        $this->replace('activity_events', $state['activity'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'project_id' => $item['projectId'] ?? null,
            'actor' => $item['actor'] ?? null,
            'type' => $item['type'] ?? 'activity',
            'summary' => $item['summary'] ?? 'Activity recorded',
            'target_type' => $item['targetType'] ?? null,
            'target_id' => $item['targetId'] ?? null,
            'metadata' => $this->encode($item['metadata'] ?? []),
            'created_at_date' => $this->dateOrNull($item['createdAt'] ?? null),
        ]);

        $this->replace('asset_versions', $state['assetVersions'] ?? [], fn ($item) => [
            'id' => $item['id'],
            'asset_id' => $item['assetId'] ?? '',
            'version' => $item['version'] ?? 1,
            'storage_path' => $item['storagePath'] ?? null,
            'created_by' => $item['createdBy'] ?? null,
            'note' => $item['note'] ?? null,
            'file_size' => $item['fileSize'] ?? 0,
            'created_at_date' => $this->dateOrNull($item['createdAt'] ?? null),
        ]);
    }

    private function activeTeam(array $team): array
    {
        return array_values(array_filter($team, function ($item): bool {
            $email = strtolower((string) ($item['email'] ?? ''));
            $id = (string) ($item['id'] ?? '');

            return ! in_array($email, self::REMOVED_DEMO_USER_EMAILS, true)
                && ! in_array($id, self::REMOVED_DEMO_USER_IDS, true);
        }));
    }

    private function normalizeTaskAssignment(array $task, array $team): array
    {
        $task['stage'] = $this->normalizeWorkflowStage($task['stage'] ?? $task['name'] ?? null);
        $assignee = $this->preferredTaskAssignee($task, $team);
        $reviewer = $this->preferredTaskReviewer($task, $team, $assignee);

        if ($this->shouldReplaceTaskPerson($task['assignee'] ?? null, $task, $team)) {
            $task['assignee'] = $assignee;
        }

        if ($this->shouldReplaceTaskPerson($task['reviewer'] ?? null, $task, $team)) {
            $task['reviewer'] = $reviewer;
        }

        return $task;
    }

    private function normalizeWorkflowStage(?string $value): string
    {
        $stage = trim((string) $value);
        $stages = [
            'Project Creation',
            'Briefing and Planning',
            'Scriptwriting',
            'Script Checking',
            'Fact Verification',
            'Recording / Raw Ready',
            'Editing Pool or Assignment',
            'Editing',
            'Version Tracking',
            'QC Checking',
            'Revision',
            'Final Verification',
            'Manager / Director Approval',
            'Ready to Publish',
            'Scheduled and Published',
            'Project Completion',
            'Analytics Update',
        ];

        if (in_array($stage, $stages, true)) {
            return $stage;
        }

        $lower = strtolower($stage);
        $map = [
            'content request' => 'Project Creation',
            'planning' => 'Briefing and Planning',
            'research' => 'Fact Verification',
            'script writing' => 'Scriptwriting',
            'internal review' => 'Script Checking',
            'management approval' => 'Manager / Director Approval',
            'graphic design' => 'Version Tracking',
            'video production' => 'Recording / Raw Ready',
            'motion graphics' => 'Version Tracking',
            'sound mixing' => 'Version Tracking',
            'quality assurance' => 'QC Checking',
            'final review' => 'Final Verification',
            'client approval' => 'Manager / Director Approval',
            'scheduling' => 'Ready to Publish',
            'publishing' => 'Scheduled and Published',
            'archive' => 'Project Completion',
        ];

        if (isset($map[$lower])) {
            return $map[$lower];
        }

        if (str_contains($lower, 'brief') || str_contains($lower, 'plan')) return 'Briefing and Planning';
        if (str_contains($lower, 'script') && str_contains($lower, 'check')) return 'Script Checking';
        if (str_contains($lower, 'script')) return 'Scriptwriting';
        if (str_contains($lower, 'final')) return 'Final Verification';
        if (str_contains($lower, 'fact') || str_contains($lower, 'verify') || str_contains($lower, 'research')) return 'Fact Verification';
        if (str_contains($lower, 'raw') || str_contains($lower, 'record') || str_contains($lower, 'production')) return 'Recording / Raw Ready';
        if (str_contains($lower, 'pool') || str_contains($lower, 'assign')) return 'Editing Pool or Assignment';
        if (str_contains($lower, 'version') || str_contains($lower, 'motion') || str_contains($lower, 'sound') || str_contains($lower, 'audio')) return 'Version Tracking';
        if (str_contains($lower, 'edit') || str_contains($lower, 'subtitle') || str_contains($lower, 'graphics')) return 'Editing';
        if (str_contains($lower, 'qc') || str_contains($lower, 'quality')) return 'QC Checking';
        if (str_contains($lower, 'revision')) return 'Revision';
        if (str_contains($lower, 'approval') || str_contains($lower, 'management')) return 'Manager / Director Approval';
        if (str_contains($lower, 'ready') || str_contains($lower, 'schedule')) return 'Ready to Publish';
        if (str_contains($lower, 'publish')) return 'Scheduled and Published';
        if (str_contains($lower, 'complete') || str_contains($lower, 'archive')) return 'Project Completion';
        if (str_contains($lower, 'analytics') || str_contains($lower, 'report')) return 'Analytics Update';

        return 'Project Creation';
    }

    private function shouldReplaceTaskPerson(?string $name, array $task, array $team): bool
    {
        $person = collect($team)->firstWhere('name', $name);
        if (! $person) {
            return true;
        }

        $role = strtolower((string) ($person['role'] ?? ''));
        $stage = $this->normalizeWorkflowStage($task['stage'] ?? $task['name'] ?? null);

        if (in_array($role, ['admin', 'administrator'], true)) {
            return true;
        }

        if (! in_array($stage, $this->workflowStagesForRole($role), true)) {
            return true;
        }

        return false;
    }

    private function workflowStagesForRole(string $role): array
    {
        return match ($role) {
            'creative manager' => [
                'Project Creation',
                'Briefing and Planning',
                'Editing Pool or Assignment',
                'Manager / Director Approval',
                'Project Completion',
                'Analytics Update',
            ],
            'coordinator' => [
                'Briefing and Planning',
                'Recording / Raw Ready',
                'Ready to Publish',
                'Project Completion',
            ],
            'scriptwriter' => [
                'Scriptwriting',
                'Script Checking',
                'Fact Verification',
            ],
            'video editor' => [
                'Editing Pool or Assignment',
                'Editing',
                'Version Tracking',
                'Revision',
            ],
            'qc' => [
                'QC Checking',
                'Final Verification',
                'Ready to Publish',
                'Scheduled and Published',
                'Analytics Update',
            ],
            default => [],
        };
    }

    private function preferredTaskAssignee(array $task, array $team): string
    {
        $stage = $this->normalizeWorkflowStage($task['stage'] ?? $task['name'] ?? null);

        if (in_array($stage, ['Scriptwriting', 'Script Checking', 'Fact Verification'], true)) {
            return $this->staffNameByRole('Scriptwriter', $team);
        }

        if (in_array($stage, ['Editing Pool or Assignment', 'Editing', 'Version Tracking', 'Revision'], true)) {
            return $this->staffNameByRole('Video Editor', $team);
        }

        if (in_array($stage, ['QC Checking', 'Final Verification', 'Scheduled and Published', 'Analytics Update'], true)) {
            return $this->staffNameByRole('QC', $team);
        }

        if (in_array($stage, ['Project Creation', 'Manager / Director Approval', 'Project Completion'], true)) {
            return $this->staffNameByRole('Creative Manager', $team);
        }

        if (in_array($stage, ['Briefing and Planning', 'Recording / Raw Ready', 'Ready to Publish'], true)) {
            return $this->staffNameByRole('Coordinator', $team);
        }

        return $this->staffNameByRole('Coordinator', $team) ?: $this->staffNameByRole('Creative Manager', $team) ?: (string) ($task['assignee'] ?? '');
    }

    private function preferredTaskReviewer(array $task, array $team, string $assignee): string
    {
        $stage = $this->normalizeWorkflowStage($task['stage'] ?? $task['name'] ?? null);

        if (in_array($stage, ['Editing', 'Version Tracking', 'Revision'], true)) {
            return $this->staffNameByRole('QC', $team) ?: $assignee;
        }

        if (in_array($stage, ['QC Checking', 'Final Verification', 'Ready to Publish', 'Scheduled and Published'], true)) {
            return $this->staffNameByRole('Creative Manager', $team) ?: $assignee;
        }

        if (in_array($stage, ['Scriptwriting', 'Script Checking', 'Fact Verification', 'Recording / Raw Ready'], true)) {
            return $this->staffNameByRole('Coordinator', $team) ?: $assignee;
        }

        if (in_array($stage, ['Project Creation', 'Briefing and Planning', 'Manager / Director Approval', 'Project Completion'], true)) {
            return $this->staffNameByRole('Creative Manager', $team) ?: $assignee;
        }

        return $this->staffNameByRole('QC', $team) ?: $this->staffNameByRole('Creative Manager', $team) ?: $assignee;
    }

    private function staffNameByRole(string $role, array $team): string
    {
        $person = collect($team)->firstWhere('role', $role);

        return (string) ($person['name'] ?? '');
    }

    private function replace(string $table, array $items, callable $map): void
    {
        DB::table($table)->delete();

        $now = now();
        foreach ($items as $item) {
            if (! isset($item['id'])) {
                continue;
            }

            DB::table($table)->insert($map($item) + [
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function setting(string $key, array $fallback): array
    {
        $value = DB::table('creative_settings')->where('key', $key)->value('value');

        return $value ? $this->decode($value) : $fallback;
    }

    private function encode(mixed $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR);
    }

    private function decode(?string $value): array
    {
        if (! $value) {
            return [];
        }

        return json_decode($value, true, 512, JSON_THROW_ON_ERROR) ?: [];
    }

    private function dateOrNull(?string $date): ?string
    {
        return $date ?: null;
    }

    private function defaultDepartments(): array
    {
        return CreativeMonitorSeed::state()['departments'];
    }

    private function canRoleOpenView(?string $role, ?string $view): bool
    {
        $allowed = match ($role) {
            'Admin' => ['flow', 'dashboard', 'admin', 'projects', 'videos', 'tasks', 'qc', 'approvals', 'assets', 'team', 'reports', 'settings'],
            'Creative Manager' => ['flow', 'projects', 'tasks', 'approvals', 'assets', 'reports'],
            'Coordinator' => ['flow', 'projects', 'tasks', 'assets'],
            'Scriptwriter' => ['flow', 'editor', 'projects', 'tasks'],
            'Video Editor' => ['flow', 'editor', 'projects', 'videos', 'tasks', 'qc', 'assets'],
            'QC' => ['flow', 'editor', 'videos', 'tasks', 'qc', 'assets'],
            'Client' => ['approvals', 'assets'],
            default => ['flow', 'editor', 'projects', 'tasks', 'assets'],
        };

        return in_array($view, $allowed, true);
    }
}
