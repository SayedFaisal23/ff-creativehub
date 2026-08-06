<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('creative_settings', function (Blueprint $table): void {
            $table->string('key')->primary();
            $table->json('value');
            $table->timestamps();
        });

        Schema::create('departments', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('projects', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('client')->nullable();
            $table->string('department')->nullable();
            $table->string('campaign')->nullable();
            $table->string('type')->nullable();
            $table->string('priority')->nullable();
            $table->string('status')->nullable();
            $table->text('description')->nullable();
            $table->text('objectives')->nullable();
            $table->string('target_audience')->nullable();
            $table->string('platform')->nullable();
            $table->decimal('budget', 12, 2)->default(0);
            $table->string('assigned_manager')->nullable();
            $table->json('assigned_team_members')->nullable();
            $table->text('internal_notes')->nullable();
            $table->text('client_notes')->nullable();
            $table->date('start_date')->nullable();
            $table->date('deadline')->nullable();
            $table->date('expected_completion')->nullable();
            $table->date('actual_completion')->nullable();
            $table->unsignedInteger('estimated_hours')->default(0);
            $table->unsignedInteger('actual_hours')->default(0);
            $table->string('workflow_stage')->nullable();
            $table->json('tags')->nullable();
            $table->json('categories')->nullable();
            $table->json('milestones')->nullable();
            $table->json('deliverables')->nullable();
            $table->json('creative_brief')->nullable();
            $table->timestamps();
        });

        Schema::create('tasks', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('project_id')->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('priority')->nullable();
            $table->string('assignee')->nullable();
            $table->string('reviewer')->nullable();
            $table->date('due_date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('completion_date')->nullable();
            $table->unsignedInteger('estimated_hours')->default(0);
            $table->unsignedInteger('actual_hours')->default(0);
            $table->json('checklist')->nullable();
            $table->json('attachments')->nullable();
            $table->json('comments')->nullable();
            $table->json('dependencies')->nullable();
            $table->unsignedInteger('revision_count')->default(0);
            $table->string('status')->nullable();
            $table->string('stage')->nullable();
            $table->timestamps();
        });

        Schema::create('approvals', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('project_id')->index();
            $table->string('deliverable');
            $table->string('level')->nullable();
            $table->string('approver')->nullable();
            $table->string('status')->nullable();
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->json('comments')->nullable();
            $table->timestamps();
        });

        Schema::create('equipment', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('type')->nullable();
            $table->string('serial_number')->nullable();
            $table->string('condition')->nullable();
            $table->string('availability')->nullable();
            $table->string('current_user')->nullable();
            $table->date('return_date')->nullable();
            $table->date('maintenance_date')->nullable();
            $table->date('warranty_date')->nullable();
            $table->date('purchase_date')->nullable();
            $table->date('replacement_date')->nullable();
            $table->json('booking_history')->nullable();
            $table->timestamps();
        });

        Schema::create('assets', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('format')->nullable();
            $table->string('project_id')->index();
            $table->string('category')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->json('tags')->nullable();
            $table->string('status')->nullable();
            $table->unsignedInteger('downloads')->default(0);
            $table->json('usage_history')->nullable();
            $table->date('created_at_date')->nullable();
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('email')->nullable()->unique();
            $table->string('title')->nullable();
            $table->string('department')->nullable();
            $table->string('role')->nullable();
            $table->unsignedTinyInteger('utilization')->default(0);
            $table->json('skills')->nullable();
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('title');
            $table->text('body')->nullable();
            $table->date('date')->nullable();
            $table->string('owner')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('actor')->nullable();
            $table->string('action');
            $table->text('detail')->nullable();
            $table->date('date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('users');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('equipment');
        Schema::dropIfExists('approvals');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('creative_settings');
    }
};
