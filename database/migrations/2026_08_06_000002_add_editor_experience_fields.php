<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->unsignedTinyInteger('progress_percent')->default(0)->after('stage');
            $table->text('last_progress_note')->nullable()->after('progress_percent');
            $table->date('last_progress_at')->nullable()->after('last_progress_note');
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->string('id')->primary();
            $table->string('user')->nullable()->index();
            $table->string('type')->nullable();
            $table->string('title');
            $table->text('message')->nullable();
            $table->string('link_view')->nullable();
            $table->boolean('read')->default(false);
            $table->date('created_at_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');

        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropColumn(['progress_percent', 'last_progress_note', 'last_progress_at']);
        });
    }
};
