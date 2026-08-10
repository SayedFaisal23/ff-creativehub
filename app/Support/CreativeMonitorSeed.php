<?php

namespace App\Support;

use Carbon\CarbonImmutable;

class CreativeMonitorSeed
{
    public static function state(): array
    {
        $date = fn (int $days): string => CarbonImmutable::now()->addDays($days)->toDateString();

        $brief = fn (array $overrides = []): array => array_merge([
            'clientBackground' => 'TBD',
            'businessObjectives' => 'TBD',
            'campaignObjectives' => 'TBD',
            'brandGuidelines' => 'Use approved logos, typography, and color standards.',
            'targetAudience' => 'TBD',
            'toneOfVoice' => 'Clear, brand-safe, audience specific',
            'competitorReferences' => 'TBD',
            'colorPalette' => 'Brand palette',
            'typography' => 'Brand fonts',
            'visualReferences' => 'Moodboard and prior campaign assets',
            'keyMessages' => 'TBD',
            'callToAction' => 'TBD',
            'platformRequirements' => 'Channel-specific exports',
            'aspectRatio' => 'TBD',
            'resolution' => 'HD and platform-native',
            'fileFormat' => 'TBD',
            'duration' => 'TBD',
            'deadline' => 'TBD',
            'budget' => 'TBD',
            'approvalRequirements' => 'Creative Lead, Marketing Manager, Client',
            'additionalNotes' => 'TBD',
        ], $overrides);

        return [
            'ui' => [
                'view' => 'dashboard',
                'selectedProjectId' => 'p-1001',
                'projectSearch' => '',
                'projectStatus' => 'All',
                'projectDepartment' => 'All',
                'taskSearch' => '',
                'taskStatus' => 'All',
                'assetSearch' => '',
            ],
            'settings' => [
                'dashboardWidgets' => [
                    'activeProjects' => true,
                    'completedProjects' => true,
                    'projectsAtRisk' => true,
                    'overdueProjects' => true,
                    'upcomingDeadlines' => true,
                    'teamWorkload' => true,
                    'serverLinks' => true,
                    'proxyQueue' => true,
                    'pendingApprovals' => true,
                    'revisionRequests' => true,
                    'publishedContent' => true,
                    'clientWaiting' => true,
                ],
                'security' => [
                    'mfa' => true,
                    'sessionTimeout' => true,
                    'encryptedStorage' => true,
                    'ipRestrictions' => false,
                    'secureBackups' => true,
                ],
            ],
            'notifications' => [
                ['id' => 'nt-1', 'user' => 'Maya Noor', 'type' => 'editing_progress', 'title' => 'Editing progress updated', 'message' => 'Ari Lim updated Assemble rough cut v2 to 75%.', 'linkView' => 'tasks', 'read' => false, 'createdAt' => $date(0)],
                ['id' => 'nt-2', 'user' => 'Ari Lim', 'type' => 'revision', 'title' => 'Revision requested', 'message' => 'Podcast identity board needs alternate cover art.', 'linkView' => 'approvals', 'read' => false, 'createdAt' => $date(-1)],
                ['id' => 'nt-3', 'user' => 'Sofia Chan', 'type' => 'approval', 'title' => 'Client approval pending', 'message' => 'Annual report proof is waiting for client approval.', 'linkView' => 'approvals', 'read' => true, 'createdAt' => $date(-1)],
            ],
            'departments' => [
                'Creative Operations',
            ],
            'projects' => [
                [
                    'id' => 'p-1001',
                    'name' => 'Seasonal Product Launch Film',
                    'code' => 'CR-2026-001',
                    'client' => 'Finesse Foods',
                    'department' => 'Creative Operations',
                    'campaign' => 'Q3 Launch',
                    'type' => 'Client Campaign Video',
                    'priority' => 'High',
                    'status' => 'In Progress',
                    'description' => 'Hero launch film with cutdowns for paid social and retail screens.',
                    'objectives' => 'Increase launch awareness and provide platform-specific content assets.',
                    'targetAudience' => 'Urban families and food service buyers',
                    'platform' => 'YouTube, Instagram, TikTok',
                    'budget' => 42000,
                    'assignedManager' => 'Maya Noor',
                    'assignedTeamMembers' => ['Ari Lim', 'Dina Rahman', 'Ken Wong'],
                    'internalNotes' => 'Color grade must match brand refresh.',
                    'clientNotes' => 'Client wants warm product close-ups.',
                    'startDate' => $date(-18),
                    'deadline' => $date(9),
                    'expectedCompletion' => $date(7),
                    'actualCompletion' => '',
                    'estimatedHours' => 180,
                    'actualHours' => 124,
                    'workflowStage' => 'Editing',
                    'tags' => ['launch', 'video', 'paid-social'],
                    'categories' => ['Campaign', 'Retail'],
                    'milestones' => ['Creative brief locked', 'Shoot completed', 'Rough cut delivered'],
                    'deliverables' => ['Hero film 60s', 'Vertical cutdown 15s', 'Retail loop 10s'],
                    'creativeBrief' => $brief([
                        'clientBackground' => 'Regional food brand with an active retail and hospitality channel.',
                        'businessObjectives' => 'Support retail sell-in and digital demand generation.',
                        'toneOfVoice' => 'Fresh, confident, precise',
                        'aspectRatio' => '16:9, 9:16, 1:1',
                        'duration' => '60s, 15s, 10s',
                        'fileFormat' => 'MP4, MOV',
                    ]),
                ],
                [
                    'id' => 'p-1002',
                    'name' => 'Annual Report Visual System',
                    'code' => 'CR-2026-002',
                    'client' => 'Northstar Capital',
                    'department' => 'Creative Operations',
                    'campaign' => 'Investor Relations',
                    'type' => 'Motion / Design Support',
                    'priority' => 'Medium',
                    'status' => 'Waiting Approval',
                    'description' => 'Design system, layout templates, icons, and executive presentation assets.',
                    'objectives' => 'Produce a polished investor report package with consistent visual language.',
                    'targetAudience' => 'Investors and board members',
                    'platform' => 'PDF, print, presentation',
                    'budget' => 28000,
                    'assignedManager' => 'Sofia Chan',
                    'assignedTeamMembers' => ['Nur Ali', 'Peter Tan'],
                    'internalNotes' => 'Financial charts require legal review.',
                    'clientNotes' => 'Conservative visual tone, avoid excessive illustration.',
                    'startDate' => $date(-26),
                    'deadline' => $date(4),
                    'expectedCompletion' => $date(3),
                    'actualCompletion' => '',
                    'estimatedHours' => 150,
                    'actualHours' => 128,
                    'workflowStage' => 'Client Approval',
                    'tags' => ['report', 'print', 'brand'],
                    'categories' => ['Corporate'],
                    'milestones' => ['Layout direction approved', 'Charts delivered', 'Proof sent'],
                    'deliverables' => ['Annual report PDF', 'Print-ready package', 'Board deck'],
                    'creativeBrief' => $brief(['toneOfVoice' => 'Measured, direct, premium', 'fileFormat' => 'PDF, INDD, PPTX']),
                ],
                [
                    'id' => 'p-1003',
                    'name' => 'Podcast Studio Pilot',
                    'code' => 'CR-2026-003',
                    'client' => 'Internal Marketing',
                    'department' => 'Creative Operations',
                    'campaign' => 'Thought Leadership',
                    'type' => 'Podcast / Long-form Video',
                    'priority' => 'High',
                    'status' => 'At Risk',
                    'description' => 'Pilot episode recording package with identity, sound design, and launch cuts.',
                    'objectives' => 'Validate production format and publish a pilot on owned channels.',
                    'targetAudience' => 'Enterprise operators and partners',
                    'platform' => 'Spotify, YouTube, LinkedIn',
                    'budget' => 16500,
                    'assignedManager' => 'Amir Hassan',
                    'assignedTeamMembers' => ['Jon Lee', 'Ari Lim', 'Rina Park'],
                    'internalNotes' => 'Guest availability may slip recording date.',
                    'clientNotes' => 'Leadership wants intro music options.',
                    'startDate' => $date(-9),
                    'deadline' => $date(2),
                    'expectedCompletion' => $date(6),
                    'actualCompletion' => '',
                    'estimatedHours' => 92,
                    'actualHours' => 50,
                    'workflowStage' => 'Sound Mixing',
                    'tags' => ['podcast', 'audio', 'internal'],
                    'categories' => ['Owned Content'],
                    'milestones' => ['Format approved', 'Episode outline drafted'],
                    'deliverables' => ['Pilot audio', 'Video highlights', 'Podcast cover art'],
                    'creativeBrief' => $brief(['toneOfVoice' => 'Sharp, credible, conversational', 'fileFormat' => 'MP3, MP4, PNG']),
                ],
            ],
            'tasks' => [
                self::task('t-1', 'p-1001', 'Assemble rough cut v2', 'Editing', 'High', 'Ari Lim', 'Maya Noor', $date(-2), $date(1), 24, 18, 'In Progress', 1),
                self::task('t-2', 'p-1001', 'Export vertical cutdowns', 'Editing', 'Medium', 'Dina Rahman', 'Maya Noor', $date(1), $date(5), 18, 0, 'Pending', 0),
                self::task('t-3', 'p-1002', 'Client proof annotations', 'Client Approval', 'High', 'Peter Tan', 'Sofia Chan', $date(-1), $date(1), 10, 8, 'Waiting Approval', 2),
                self::task('t-4', 'p-1003', 'Guest release forms', 'Planning', 'High', 'Amir Hassan', 'Maya Noor', $date(-4), $date(-1), 5, 2, 'Blocked', 0),
            ],
            'approvals' => [
                self::approval('a-1', 'p-1001', 'Hero film rough cut v2', 'Creative Lead', 'Maya Noor', 'Pending', $date(1), 'Video timing and product shots'),
                self::approval('a-2', 'p-1002', 'Annual report proof', 'Client', 'Northstar Client', 'Pending', $date(2), 'Executive proof package'),
                self::approval('a-3', 'p-1003', 'Podcast identity board', 'Marketing Manager', 'Sofia Chan', 'Revision Requested', $date(-1), 'Needs alternate cover art'),
            ],
            'equipment' => [],
            'assets' => [
                self::asset('as-1', 'Hero_RoughCut_v2.mov', 'MOV', 'p-1001', 'Video', 2, ['rough-cut', 'client-review'], 'Waiting Approval', 18),
                self::asset('as-2', 'AnnualReport_Master.indd', 'INDD', 'p-1002', 'Project File', 5, ['layout', 'source'], 'Revision Required', 12),
                self::asset('as-3', 'Podcast_Cover_Concepts.fig', 'Figma', 'p-1003', 'Brand Asset', 3, ['cover', 'identity'], 'Revision Required', 8),
            ],
            'team' => [
                self::person('u-1', 'Maya Noor', 'Creative Lead', 'Creative Operations', 'Admin', 88, ['Approval', 'Resource planning', 'Video review']),
                self::person('u-2', 'Sofia Chan', 'Design Manager', 'Creative Operations', 'Manager', 76, ['Design systems', 'Client proofing']),
                self::person('u-3', 'Ari Lim', 'Video Editor', 'Creative Operations', 'Member', 92, ['Editing', 'Color', 'Motion']),
                self::person('u-4', 'Dina Rahman', 'Production Coordinator', 'Creative Operations', 'Member', 68, ['Production prep', 'Raw readiness checks']),
                self::person('u-5', 'Ken Wong', 'Audio Producer', 'Creative Operations', 'Member', 54, ['Mixing', 'Voice cleanup']),
            ],
            'announcements' => [
                ['id' => 'n-1', 'title' => 'Studio B unavailable', 'body' => 'Maintenance window booked for Friday afternoon.', 'date' => $date(1), 'owner' => 'Operations'],
                ['id' => 'n-2', 'title' => 'Brand asset audit', 'body' => 'Logo and font folders are being reconciled this week.', 'date' => $date(-1), 'owner' => 'Design'],
            ],
            'audit' => [
                ['id' => 'log-1', 'actor' => 'System', 'action' => 'Database seed', 'detail' => 'Initial Creative Monitor data loaded', 'date' => $date(0)],
                ['id' => 'log-2', 'actor' => 'Ari Lim', 'action' => 'Server link registered', 'detail' => 'Registered Hero_RoughCut_v2.mov NAS path', 'date' => $date(-3)],
            ],
            'workflowWeightage' => [
                ['stage' => 'Briefing', 'weight' => 5],
                ['stage' => 'Scriptwriting', 'weight' => 10],
                ['stage' => 'Script Checking', 'weight' => 5],
                ['stage' => 'Fact Verification', 'weight' => 5],
                ['stage' => 'Recording / Raw Ready', 'weight' => 10],
                ['stage' => 'Editing', 'weight' => 35],
                ['stage' => 'QC', 'weight' => 15],
                ['stage' => 'Final Verification and Approval', 'weight' => 10],
                ['stage' => 'Publishing', 'weight' => 5],
            ],
            'videos' => [
                self::video('VID-0128', 'p-1001', 'Seasonal launch hero cut', 'Client Campaign', 'Ari Lim', 'Maya Noor', 'Editing', 'Submitted for QC', 75, 4, 'Amber', 'Awaiting subtitle QC', 82, 1, $date(6)),
                self::video('VID-0131', 'p-1003', 'Podcast launch teaser', 'Podcast', 'Ari Lim', 'Maya Noor', 'QC', 'Revision Required', 68, 3, 'Red', 'Two open subtitle remarks', 71, 2, $date(3)),
            ],
            'qcRemarks' => [
                self::qcRemark('RMK-VID0128-0041', 'p-1001', 'VID-0128', 'as-1', 'Maya Noor', 'Subtitle', 'Minor', '01:35', 'Correct subtitle spelling and keep line break inside safe area.', 'Ari Lim', 'Open', false, $date(-1)),
                self::qcRemark('RMK-VID0131-0020', 'p-1003', 'VID-0131', 'as-3', 'Maya Noor', 'Audio', 'Major', '00:12', 'Voice level drops under music bed; rebalance mix before approval.', 'Ken Wong', 'Acknowledged', true, $date(-1)),
            ],
        ];
    }

    private static function video(string $id, string $projectId, string $title, string $contentType, string $editor, string $qc, string $stage, string $status, int $progress, int $difficulty, string $redFlag, string $blocker, int $qcScore, int $revisionCount, string $deadline): array
    {
        return [
            'id' => $id,
            'projectId' => $projectId,
            'title' => $title,
            'contentType' => $contentType,
            'platform' => 'Instagram, TikTok, YouTube',
            'format' => '16:9 / 9:16 / 1:1',
            'duration' => '30s - 60s',
            'resolution' => '1080p / 4K',
            'aspectRatio' => 'Multi-format',
            'scriptwriter' => $editor,
            'checker' => 'Sofia Chan',
            'verifier' => 'Maya Noor',
            'editor' => $editor,
            'qc' => $qc,
            'approver' => 'Maya Noor',
            'publisher' => 'Sofia Chan',
            'currentStage' => $stage,
            'detailedStatus' => $status,
            'progress' => $progress,
            'difficulty' => $difficulty,
            'redFlag' => $redFlag,
            'blocker' => $blocker,
            'rawPath' => "raw/{$projectId}",
            'projectPath' => "project-files/{$projectId}",
            'previewPath' => "proxies/{$projectId}/preview_proxy.mp4",
            'finalPath' => "exports/{$projectId}",
            'qcScore' => $qcScore,
            'verificationResult' => $redFlag === 'Red' ? 'Needs Correction' : 'Verified',
            'revisionCount' => $revisionCount,
            'firstPass' => false,
            'captionStatus' => 'Draft',
            'thumbnailStatus' => 'Pending',
            'scheduledAt' => $deadline,
            'publishedUrl' => '',
            'createdAt' => CarbonImmutable::now()->subDays(10)->toDateString(),
            'deadline' => $deadline,
        ];
    }

    private static function qcRemark(string $id, string $projectId, string $videoId, string $versionId, string $createdBy, string $category, string $severity, string $timecode, string $instruction, string $assignedTo, string $status, bool $repeated, string $createdAt): array
    {
        return compact('id', 'projectId', 'videoId', 'versionId', 'createdBy', 'category', 'severity', 'timecode', 'instruction', 'assignedTo', 'status', 'repeated', 'createdAt') + [
            'resolutionVersion' => '',
        ];
    }

    private static function task(string $id, string $projectId, string $name, string $stage, string $priority, string $assignee, string $reviewer, string $startDate, string $dueDate, int $estimatedHours, int $actualHours, string $status, int $revisionCount): array
    {
        $progressPercent = $status === 'Completed' ? 100 : min(98, max(0, (int) round(($actualHours / max($estimatedHours, 1)) * 100)));

        return [
            'id' => $id,
            'projectId' => $projectId,
            'name' => $name,
            'description' => "{$name} for {$stage}.",
            'priority' => $priority,
            'assignee' => $assignee,
            'reviewer' => $reviewer,
            'dueDate' => $dueDate,
            'startDate' => $startDate,
            'completionDate' => $status === 'Completed' ? $dueDate : '',
            'estimatedHours' => $estimatedHours,
            'actualHours' => $actualHours,
            'checklist' => [['text' => 'Source files checked', 'done' => $status === 'Completed']],
            'attachments' => [],
            'comments' => [],
            'dependencies' => [],
            'revisionCount' => $revisionCount,
            'status' => $status,
            'stage' => $stage,
            'progressPercent' => $progressPercent,
            'lastProgressNote' => '',
            'lastProgressAt' => '',
        ];
    }

    private static function approval(string $id, string $projectId, string $deliverable, string $level, string $approver, string $status, string $dueDate, string $notes): array
    {
        return compact('id', 'projectId', 'deliverable', 'level', 'approver', 'status', 'dueDate', 'notes') + ['comments' => []];
    }

    private static function equipment(string $id, string $name, string $type, string $serialNumber, string $condition, string $availability, string $currentUser, string $returnDate, string $maintenanceDate, string $purchaseDate, string $replacementDate): array
    {
        return [
            'id' => $id,
            'name' => $name,
            'type' => $type,
            'serialNumber' => $serialNumber,
            'condition' => $condition,
            'availability' => $availability,
            'currentUser' => $currentUser,
            'returnDate' => $returnDate,
            'maintenanceDate' => $maintenanceDate,
            'warrantyDate' => $replacementDate,
            'purchaseDate' => $purchaseDate,
            'replacementDate' => $replacementDate,
            'bookingHistory' => [],
        ];
    }

    private static function asset(string $id, string $name, string $format, string $projectId, string $category, int $version, array $tags, string $status, int $downloads): array
    {
        return compact('id', 'name', 'format', 'projectId', 'category', 'version', 'tags', 'status', 'downloads') + [
            'storageDisk' => 'nas',
            'storagePath' => "raw/{$projectId}/{$name}",
            'originalFilename' => $name,
            'fileSize' => 0,
            'mimeType' => '',
            'uploadStatus' => 'on_nas',
            'processingStatus' => 'not_started',
            'proxyPath' => "proxies/{$projectId}/".pathinfo($name, PATHINFO_FILENAME).'_proxy.mp4',
            'previewPath' => '',
            'versionHistory' => [[
                'id' => "av-{$id}-1",
                'assetId' => $id,
                'version' => $version,
                'storagePath' => "raw/{$projectId}/{$name}",
                'createdBy' => 'System',
                'note' => 'Initial seed asset',
                'fileSize' => 0,
                'createdAt' => CarbonImmutable::now()->subDays(3)->toDateString(),
            ]],
            'usageHistory' => [],
            'createdAt' => CarbonImmutable::now()->subDays(3)->toDateString(),
        ];
    }

    private static function person(string $id, string $name, string $title, string $department, string $role, int $utilization, array $skills): array
    {
        return compact('id', 'name', 'title', 'department', 'role', 'utilization', 'skills');
    }
}
