<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->text('nas_folder')->nullable()->after('creative_brief');
            $table->json('access_members')->nullable()->after('nas_folder');
        });

        Schema::table('assets', function (Blueprint $table): void {
            $table->text('proxy_path')->nullable()->after('processing_status');
            $table->text('preview_path')->nullable()->after('proxy_path');
            $table->json('version_history')->nullable()->after('preview_path');
        });

        Schema::create('project_comments', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('project_id')->index();
            $table->string('task_id')->nullable()->index();
            $table->string('asset_id')->nullable()->index();
            $table->string('author')->nullable();
            $table->text('body');
            $table->json('mentions')->nullable();
            $table->date('created_at_date')->nullable();
            $table->timestamps();
        });

        Schema::create('activity_events', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('project_id')->nullable()->index();
            $table->string('actor')->nullable();
            $table->string('type')->index();
            $table->text('summary');
            $table->string('target_type')->nullable();
            $table->string('target_id')->nullable();
            $table->json('metadata')->nullable();
            $table->date('created_at_date')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_versions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('asset_id')->index();
            $table->unsignedInteger('version')->default(1);
            $table->text('storage_path')->nullable();
            $table->string('created_by')->nullable();
            $table->text('note')->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->date('created_at_date')->nullable();
            $table->timestamps();
        });

        Schema::create('upload_sessions', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('project_id')->index();
            $table->string('filename');
            $table->text('storage_path');
            $table->unsignedBigInteger('total_size')->default(0);
            $table->unsignedInteger('total_chunks')->default(0);
            $table->json('received_chunks')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('category')->nullable();
            $table->string('status')->default('uploading');
            $table->string('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('upload_sessions');
        Schema::dropIfExists('asset_versions');
        Schema::dropIfExists('activity_events');
        Schema::dropIfExists('project_comments');

        Schema::table('assets', function (Blueprint $table): void {
            $table->dropColumn(['proxy_path', 'preview_path', 'version_history']);
        });

        Schema::table('projects', function (Blueprint $table): void {
            $table->dropColumn(['nas_folder', 'access_members']);
        });
    }
};
