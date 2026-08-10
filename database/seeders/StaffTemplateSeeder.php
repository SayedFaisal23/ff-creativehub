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
            ['coord-1', 'Project Coordinator', 'coordinator@example.com', 'Project Coordinator / Producer', 'Coordinator', 0, ['Briefing', 'Scheduling', 'Raw readiness', 'NAS paths']],
            ['scr-1', 'Scriptwriter', 'scriptwriter@example.com', 'Scriptwriter / Verifier', 'Scriptwriter', 0, ['Scriptwriting', 'Script checking', 'Fact verification', 'CTA']],
            ['edt-1', 'Video Editor', 'editor@example.com', 'Video Editor / Motion / Audio', 'Video Editor', 0, ['Editing', 'Subtitles', 'Color', 'Motion graphics', 'Sound mixing']],
            ['qc-1', 'QC Reviewer', 'qc@example.com', 'QC / Approver / Publisher', 'QC', 0, ['Video QC', 'Final verification', 'Approval', 'Publishing', 'Live URLs']],
        ];

        DB::table('users')
            ->whereIn('email', [
                'approver@example.com',
                'audio@example.com',
                'final.verifier@example.com',
                'motion@example.com',
                'production@example.com',
                'publisher@example.com',
                'script.checker@example.com',
                'verifier@example.com',
            ])
            ->orWhereIn('id', [
                'app-1',
                'aud-1',
                'fv-1',
                'des-1',
                'prod-1',
                'pub-1',
                'chk-1',
                'ver-1',
            ])
            ->delete();

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
