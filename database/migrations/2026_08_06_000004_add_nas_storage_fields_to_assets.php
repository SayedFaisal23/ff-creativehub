<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table): void {
            $table->string('storage_disk')->default('nas')->after('category');
            $table->text('storage_path')->nullable()->after('storage_disk');
            $table->string('original_filename')->nullable()->after('storage_path');
            $table->unsignedBigInteger('file_size')->default(0)->after('original_filename');
            $table->string('mime_type')->nullable()->after('file_size');
            $table->string('upload_status')->default('metadata_only')->after('mime_type');
            $table->string('processing_status')->default('not_started')->after('upload_status');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table): void {
            $table->dropColumn([
                'storage_disk',
                'storage_path',
                'original_filename',
                'file_size',
                'mime_type',
                'upload_status',
                'processing_status',
            ]);
        });
    }
};
