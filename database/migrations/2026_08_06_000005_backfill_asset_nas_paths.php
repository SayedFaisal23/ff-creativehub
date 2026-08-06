<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('assets')
            ->where(function ($query): void {
                $query->whereNull('storage_path')->orWhere('storage_path', '');
            })
            ->get()
            ->each(function ($asset): void {
                DB::table('assets')
                    ->where('id', $asset->id)
                    ->update([
                        'storage_disk' => 'nas',
                        'storage_path' => "raw/{$asset->project_id}/{$asset->name}",
                        'original_filename' => $asset->name,
                        'upload_status' => 'on_nas',
                        'processing_status' => 'not_started',
                    ]);
            });
    }

    public function down(): void
    {
        DB::table('assets')
            ->where('storage_disk', 'nas')
            ->update([
                'storage_path' => null,
                'original_filename' => null,
                'upload_status' => 'metadata_only',
                'processing_status' => 'not_started',
            ]);
    }
};
