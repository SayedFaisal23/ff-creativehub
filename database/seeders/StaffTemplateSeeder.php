<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StaffTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('departments')->updateOrInsert(
            ['name' => 'Creative Operations'],
            ['created_at' => $now, 'updated_at' => $now],
        );

        $staff = [
            ['admin-1', 'Admin', 'admin@example.com', 'System Admin', 'Admin', 0, ['Users', 'Permissions', 'System setup']],
            ['mgr-1', 'Creative Manager', 'creative.manager@example.com', 'Creative Manager', 'Creative Manager', 0, ['Project intake', 'Assignment', 'Approval']],
            ['coord-1', 'Project Coordinator', 'coordinator@example.com', 'Project Coordinator', 'Coordinator', 0, ['Briefing', 'Scheduling', 'Server links']],
            ['scr-1', 'Scriptwriter', 'scriptwriter@example.com', 'Scriptwriter', 'Scriptwriter', 0, ['Scriptwriting', 'Hook', 'CTA']],
            ['chk-1', 'Script Checker', 'script.checker@example.com', 'Script Checker', 'Script Checker', 0, ['Script checking', 'Tone', 'Structure']],
            ['ver-1', 'Verifier', 'verifier@example.com', 'Researcher / Verifier', 'Verifier', 0, ['Fact verification', 'Sources', 'Compliance']],
            ['prod-1', 'Production Coordinator', 'production@example.com', 'Production Coordinator', 'Coordinator', 0, ['Recording', 'Raw readiness', 'NAS paths']],
            ['edt-1', 'Video Editor', 'editor@example.com', 'Video Editor', 'Video Editor', 0, ['Editing', 'Subtitles', 'Color']],
            ['aud-1', 'Audio Producer', 'audio@example.com', 'Audio Producer', 'Member', 0, ['Sound mixing', 'Voice cleanup', 'Loudness']],
            ['des-1', 'Motion Designer', 'motion@example.com', 'Motion Designer', 'Graphic Designer', 0, ['Motion graphics', 'Thumbnail', 'Lower thirds']],
            ['qc-1', 'QC Reviewer', 'qc@example.com', 'QC Reviewer', 'QC', 0, ['Video QC', 'Subtitle QC', 'Technical output']],
            ['fv-1', 'Final Verifier', 'final.verifier@example.com', 'Final Verifier', 'Final Verifier', 0, ['Final verification', 'Format check', 'Client requirements']],
            ['app-1', 'Approver', 'approver@example.com', 'Approver', 'Approver', 0, ['Approval', 'Escalation', 'Final decision']],
            ['pub-1', 'Publisher', 'publisher@example.com', 'Publisher', 'Publisher', 0, ['Scheduling', 'Captions', 'Live URLs']],
        ];

        foreach ($staff as [$id, $name, $email, $title, $role, $utilization, $skills]) {
            DB::table('users')->updateOrInsert(
                ['email' => $email],
                [
                    'id' => $id,
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'title' => $title,
                    'department' => 'Creative Operations',
                    'role' => $role,
                    'utilization' => $utilization,
                    'skills' => json_encode($skills, JSON_THROW_ON_ERROR),
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }
}
