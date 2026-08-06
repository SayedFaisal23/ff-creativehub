<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('assets')->orderBy('id')->get()->each(function ($asset): void {
            if (DB::table('asset_versions')->where('asset_id', $asset->id)->exists()) {
                return;
            }

            DB::table('asset_versions')->insert([
                'id' => "av-{$asset->id}-{$asset->version}",
                'asset_id' => $asset->id,
                'version' => $asset->version,
                'storage_path' => $asset->storage_path,
                'created_by' => 'System',
                'note' => 'Backfilled from existing asset',
                'file_size' => $asset->file_size ?? 0,
                'created_at_date' => $asset->created_at_date,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        DB::table('asset_versions')
            ->where('note', 'Backfilled from existing asset')
            ->delete();
    }
};
