# FF Creative Hub

A Laravel + MySQL MVP for a Creative Department Management System.

The original static prototype remains available at `index.html`, but the database-backed app is served by Laravel from `/`.

## Run With Docker

Docker Desktop must be running.

```bash
docker compose up --build
```

Then open:

```text
http://localhost:8888
```

phpMyAdmin is available at:

```text
http://localhost:8081
```

Use:

```text
Server: mysql
Username: creative_monitor
Password: creative_monitor
Database: creative_monitor
```

## Login

The app now requires login. Existing demo users use:

```text
Password: password
```

Useful demo accounts:

```text
Maya Noor - Admin
Ari Lim - Editor/Member
Sofia Chan - Manager
```

Admins and managers land in the `Admin` workspace. Editors and members land in `My Work`.

The app container installs Composer dependencies when needed, generates `APP_KEY`, runs migrations, starts Laravel, and bootstraps demo data when the database is empty.

## Run Without Docker

Install PHP 8.3+, Composer, and MySQL. Then:

```bash
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Update `.env` if your local MySQL credentials differ.

## Database-Backed Behavior

The browser app loads state from:

```text
GET /api/state
```

Every project, task, approval, asset, equipment booking, user, setting, and audit change is saved back through:

```text
PUT /api/state
```

Laravel stores the data in MySQL tables under `database/migrations`.

## NAS Storage For Raw Footage

Raw footage should live on the NAS, not in MySQL. MySQL stores the asset metadata only: project, filename, relative NAS path, file size, upload status, and processing status.

For Docker, map your NAS share on Windows first, for example as `Z:\CreativeMonitor`, then set:

```env
NAS_HOST_PATH=Z:\CreativeMonitor
FILESYSTEM_DISK=nas
NAS_STORAGE_PATH=/mnt/creative-nas
```

Docker mounts `NAS_HOST_PATH` into the app container at `/mnt/creative-nas`. Inside the app, use relative paths such as:

```text
raw/CR-2026-001/Hero_RoughCut_v2.mov
proxies/CR-2026-001/Hero_RoughCut_v2_proxy.mp4
exports/CR-2026-001/Hero_Final.mp4
```

If `NAS_HOST_PATH` is not set, Docker falls back to `./storage/app/nas` for local testing.

The app now includes:

- Project NAS folder generation for `raw`, `proxies`, `project-files`, `exports`, `briefs`, and `references`
- Chunked browser uploads into the NAS mount
- Asset proxy queue status and preview paths
- Browser preview route for NAS-backed image/video proxy files
- Project comments with `@mentions`
- Project activity timelines
- Project-level access members in addition to assigned teams
- Asset version history records

Workflow API routes:

```text
POST /api/projects/folders
POST /api/assets/chunked/start
POST /api/assets/chunked/{uploadId}/chunk
POST /api/assets/chunked/{uploadId}/complete
POST /api/assets/proxy/queue
GET  /api/assets/{assetId}/stream
```

Proxy generation is queued and tracked in the database. To make actual proxy files automatically, add an FFmpeg worker that reads `processing_status=proxy_needed`, creates the MP4 under the recorded `proxy_path`, then marks the asset `proxy_ready`.

## FF Creative Hub Workflow Reference

The app now incorporates the `FF_Creative_Hub_Complete_Workflow.pdf` specification:

- Video-level tracker with Video ID, PIC roles, server paths, publishing fields, QC score, revision count, difficulty and red-flag level
- QC / verification module with structured remarks, severity, timecode, assigned owner, repeated-issue flag and resolution status
- Configurable workflow weightage defaults: briefing, scriptwriting, checking, fact verification, raw readiness, editing, QC, final approval and publishing
- Role options aligned to the workflow: Director, Creative Manager, Coordinator, Scriptwriter, Checker, Verifier, Video Editor, QC, Final Verifier, Approver and Publisher
- Management command center now surfaces red-flag videos and major open QC remarks

The system still follows the PDF boundary: media files stay on the NAS/file server; the website stores tracking data, paths, QC records, approvals, audit history and analytics.

## Included Modules

- Editor-friendly `My Work` view with assigned tasks, quick progress updates, ready-for-review handoff, and personal notifications
- Admin-friendly command center for at-risk projects, blocked tasks, approval queues, workload watch, equipment status, and department notifications
- Dashboard KPIs and configurable widgets
- Project register, workflow stage tracking, creative brief, milestones, deliverables
- Task kanban with revision counts and status changes
- Multi-level approval queue
- Asset library with metadata, versioning, duplicate count, and download tracking
- Equipment booking and return tracking
- Calendar with project, task, approval, and equipment events
- Team utilization and role overview
- Reports with PDF print, Excel, and CSV export
- Settings, security toggles, and audit log
