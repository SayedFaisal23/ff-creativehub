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

Every project, video tracker item, task, QC remark, approval, server link, user, setting, and audit change is saved back through:

```text
PUT /api/state
```

Laravel stores the data in MySQL tables under `database/migrations`.

## NAS Storage And Server Links

Raw footage, audio, working project files, previews, and final exports should live on the NAS/file server, not in MySQL or the web app. MySQL stores tracking metadata only: project, filename, NAS/server path, file size, readiness status, proxy status, versions, QC records, approvals, audit logs, and publishing references.

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
- Server-link registration for existing NAS paths
- Proxy queue status and preview paths
- Browser preview route for NAS-backed image/video proxy files
- Project comments with `@mentions`
- Project activity timelines
- Project-level access members in addition to assigned teams
- Version history records for server-linked files

Workflow API routes:

```text
POST /api/projects/folders
POST /api/assets/proxy/queue
GET  /api/assets/{assetId}/stream
```

Proxy generation is queued and tracked in the database. The included FFmpeg worker reads `processing_status=proxy_needed`, creates the MP4 under the recorded `proxy_path`, then marks the asset `proxy_ready`.

This project now includes that worker. After the Docker image is rebuilt, run:

```bash
docker compose exec app php artisan creative:process-proxies --limit=5
```

Useful options:

```bash
docker compose exec app php artisan creative:process-proxies --dry-run
docker compose exec app php artisan creative:process-proxies --limit=20
```

The worker reads NAS-backed assets marked `proxy_needed`, creates browser-friendly MP4 previews with FFmpeg, updates the asset to `proxy_ready`, and sends database notifications to the assigned project team. If conversion fails, the asset is marked `proxy_failed`.

## Device Notifications

Users can enable browser/device alerts from the signed-in user strip inside the app. This uses the browser Notification API, so it works while the app is open or installed as a browser app/PWA. For true background phone push when the browser is closed, add a Web Push provider with HTTPS and VAPID keys.

Notification events currently include:

- Editing progress updates
- QC remarks assigned, resolved, or reopened
- Server link registered
- Proxy queued, ready, or failed
- Mentions in project comments

## Timecoded QC

The QC workspace now supports creating and editing timecoded remarks. Each remark stores video ID, category, severity, timecode, decision, assigned owner, repeated issue flag, resolution version, and status. Editors can acknowledge, mark fixed, or reopen remarks from the QC queue.

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
- Admin-friendly command center for at-risk projects, blocked tasks, approval queues, workload watch, publishing readiness, storage readiness, and department notifications
- Dashboard KPIs and configurable widgets
- Project register, workflow stage tracking, creative brief, milestones, deliverables
- Task kanban with revision counts and status changes
- Multi-level approval queue
- Server Links register with NAS paths, metadata, proxy readiness, versioning, and path-copy tracking
- Staff utilization, roles, workload, and scorecard foundation
- Reports with PDF print, Excel, and CSV export
- Settings, security toggles, and audit log
