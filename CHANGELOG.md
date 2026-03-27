# Changelog

All notable changes to HivePulse are documented here.

## [1.2.0] — 2026-03-27

### 🚀 Features

- Add inline notification log list to ChannelCard with summary row and collapsible log entries

### ♻️ Refactor

- `ListLogs` LEFT JOINs monitors to return `monitor_name`; `Logs` handler maps through `logResponse` DTO with RFC3339 timestamps and Swagger annotation

### 🧪 Tests

- Add ChannelCard log UI tests (TDD) and backend integration test cases for `MonitorName` in `ListLogs`

## [1.1.0] — 2026-03-26

### ♻️ Refactor

- Replace tag filter chips with select box in search row


### 🐛 Bug Fixes

- Show down bar in compact uptime view and skip TLS verify in HTTP checker


- Show down blocks in compact uptime bar and add per-monitor TLS verify toggle


- Show error detail for down monitors, fix skip_tls_verify save, unify into single Docker image


### 🚀 Features

- Add Void Dark theme from Beedevz design system


- Add font pair selection in Settings > General


- Show tags on monitor items and add tag filter in left panel


## [1.0.0] — 2026-03-26

### 🐛 Bug Fixes

- Initialize GeneralSettingsSection timezone state to empty string


- Resolve lint errors in GeneralSettingsSection and modal test files


- Update notification_handler_test mock to match new GetChannelsForMonitor signature


- Remove unused toChannelSlice function from notification_repo


### 📚 Documentation

- Regenerate swagger docs for Slice 10 endpoints


### 🚀 Features

- Add triggers JSONB column to monitor_notification_channels


- Add AssignmentTriggers, MonitorChannelAssignment, GeneralSettings domain types


- Update NotificationRepository port, add SettingsRepository port, regenerate mocks


- Add SettingsUsecase and SettingsRepo (GetGeneral/SaveGeneral via app_settings)


- Update GetChannelsForMonitor to return MonitorChannelAssignment, add UpdateAssignmentTriggers and LastSentAt


- Update NotificationUsecase with cooldown/schedule trigger checks and IsWithinSchedule


- Update notification handler (assignments response, triggers endpoint), add general settings handler, wire in main.go


- Add MonitorChannelAssignment types, useUpdateAssignmentTriggers, useGeneralSettings hooks, update MSW


- Add AssignmentTriggerModal with cooldown and schedule config


- Add GeneralSettingsSection with timezone dropdown


- Wire AssignmentTriggerModal into MonitorDetailSection, add General tab to SettingsPage


## [0.9.0] — 2026-03-26

### 🎨 Styling

- Widen LeftPanel to 300px, increase font sizes, add card backgrounds to detail sections


### 🐛 Bug Fixes

- TopNav status pill theme-safe color and avatar keyboard accessibility


- Remove unsupported 'slow' status from MonitorListItem and UptimeBar


- TopNav status pill shows correct dots and add leftPanelBg color token


- Export BlockStatus from UptimeBar and remove unused React import in MonitorsPage test


- Resolve lint errors — no-explicit-any in tests, exhaustive-deps in useInitAuth


- Resolve CI lint failures — crypto/rand for slug generation, pure Date.now via module constant


- Resolve CodeQL XSS alert — move preview link out of helperText, encode slug in URL


### 🚀 Features

- Add AppLayout and TopNav components


- Add MonitorDetailSection extracted from MonitorDetailPage


- Add MonitorListItem compact row with UptimeBar


- Add StatsBar with 4 metric cells


- Add LeftPanel with monitor list, search, and scroll-to-selected


- Add MonitorsPage split panel layout


- Wire AppLayout into router and remove Sidebar from AlertsPage/SettingsPage


- Polish dashboard UI and fix monitor detail data gaps


- Add tags, monitor_tags, status_pages, status_page_tags migrations


- Add Tag domain, port, repo, and usecase with tests


- Add tag assignment to MonitorUsecase and MonitorRepo


- Add TagHandler with monitor tag assignment routes


- Add StatusPage domain, port, repo, and usecase with tests


- Add StatusPageHandler, wire routes and public /s/:slug endpoint; regen swagger


- Add Tag and StatusPage domain types, hooks, and MSW handlers


- Add PublicStatusPage with monitor list, status banner, incident sections


- Add StatusPagesPage, StatusPageModal, StatusPageCard, TagManager


- Wire StatusPagesPage and PublicStatusPage routes, add Status to TopNav, add tag chips to MonitorDetailSection


- Move Tags to Settings sidebar, improve color picker UX, redesign Settings layout


- Status page public view, brand redesign, dark/light theme polish


### 🧪 Tests

- Strengthen MonitorDetailSection test assertions and coverage


- Strengthen StatsBar test coverage for computed values


- Add LeftPanel search filtering and empty state tests


- Strengthen MonitorsPage detail section assertion


## [0.7.0] — 2026-03-25

### 🚀 Features

- Add packet_count and dns_server fields to MonitorModal; show host:port and record_type in MonitorCard


## [0.6.0] — 2026-03-25

### 🎨 Styling

- Remove honeycomb background pattern from dark and light themes


### 🐛 Bug Fixes

- Correct ListChannels ORDER BY, ListLogs LIMIT, HasRecentSSLLog interval format


- Remount ChannelModal on channel change so edit form populates correctly


- Pre-populate webhook URL and slack webhook URL fields when editing a channel


- Remove unused hexDark/hexLight constants to fix TS6133 build error


- Disable set-state-in-effect lint for SMTP form sync; set TLS MinVersion 1.2 in ssl_checker


- Quote user-provided monitorID in log statements to prevent log injection


### 🚀 Features

- Add notification_channels, monitor_notification_channels, notification_logs migrations


- Add notification domain types and port interfaces


- Generate mockery mocks for notification interfaces


- Add NotificationRepo with CRUD, FindReminders, HasRecentSSLLog


- Add email, webhook, slack senders and notification dispatcher


- Add NotificationUsecase with Notify, NotifyReminders, and CRUD


- Integrate Notifier into CheckerUsecase via SetNotifier setter


- Add SetReminder to Aggregator; fire NotifyReminders after DB transaction


- Add SSLChecker that fires ssl_expiry notifications with 24h deduplication


- Add SMTP config fields; wire EmailSender to use infrastructure.Config


- Add NotificationHandler with CRUD, logs, and monitor channel assignment


- Wire notification engine into main.go; add /notification-channels routes; regen swagger


- Add notification domain types, useNotifications hooks, and MSW handlers


- Add ChannelCard and ChannelModal components with tests


- Add Notifications tab to SettingsPage with channel CRUD


- Add notification channel override section to MonitorDetailPage (admin only)


- Add SMTP settings API and test notification endpoint


- Add SMTP settings form, is-global tooltip, and test notification button


## [0.5.0] — 2026-03-24

### 🐛 Bug Fixes

- Use type-only imports for verbatimModuleSyntax compliance


### 🚀 Features

- Add stats_hourly and stats_daily migrations


- Add StatsBucket domain type and StatsRepository port interface


- Add StatsRepo GORM adapter


- Add StatsUsecase with GetStats and unit tests


- Add StatsService interface and Stats handler to MonitorHandler


- Add aggregator goroutine and integration test


- Wire statsRepo, statsUsecase, aggregator, and stats route in main.go; regen swagger


- Add StatsResponse types and useStats hook


- Add UptimeHeatmap component with gradient color coding


- Add ResponseTimeChart component using recharts


- Add MonitorDetailPage with uptime heatmap and response time chart


## [0.4.0] — 2026-03-24

### 🐛 Bug Fixes

- Remove unused imports in MonitorCard test


- Constrain card max-width and improve card visual styling


- Resolve CI lint errors and regenerate swagger docs


- Sanitize monitorID in log statements to prevent log injection (CWE-117)


### 🚀 Features

- Add last_status column and incidents table migrations


- Add Incident domain type and IncidentRepository + UpdateLastStatus port


- Add last_status field and UpdateLastStatus to monitor repo


- Add IncidentRepo with GORM implementation and integration tests


- Regenerate MonitorRepository mock and add IncidentRepository mock


- Add incident transition logic to CheckerUsecase


- Use stored last_status from monitor domain in handler


- Add incident handler and wire into server


- Add Incident domain type, useIncidents hook, and MSW handler


- Add MonitorCard component with UptimeBar, sparkline, and shake animation


- Add MonitorSearch and replace MonitorTable with MonitorCard in DashboardPage


- Add AlertsPage, Alerts nav link, and /alerts route


- Redesign sidebar, dashboard layout, and alerts page UI


- Apply HivePulse design system — typography, colors, honeycomb bg


## [0.3.0] — 2026-03-23

### 🐛 Bug Fixes

- Handle errcheck + gosimple lint warnings in checker usecase and ws hub


- Add WebSocket upgrade headers to nginx proxy config


### 🚀 Features

- Add websocket/cron/probing deps + heartbeats migration


- Add websocket/cron/probing deps to go.mod


- Heartbeat domain type + port interfaces (CheckerService, CheckRunner, WSBroadcaster, SchedulerService, HeartbeatRepository)


- Heartbeat repository + MonitorRepo.FindAllEnabled


- Generate mocks for CheckerService, CheckRunner, WSBroadcaster, SchedulerService, HeartbeatRepository + regenerate MonitorRepository


- HTTP checker adapter with tests


- TCP checker adapter with tests


- PING checker adapter with tests


- DNS checker adapter with tests


- Checker usecase (RunCheck with retry + broadcast)


- WebSocket hub with broadcast + test client helper


- Cron scheduler (Add/Remove/Update + Start/Stop)


- WebSocket handler + JWT query param fallback for WS connections


- MonitorUsecase scheduler integration + MonitorHandler real stats + heartbeats endpoint


- Wire WebSocket route + startup scheduler seeding + graceful shutdown


- WebSocket client (exponential backoff) + useWebSocket hook with React Query cache patching


- UseHeartbeats hook + DashboardPage WebSocket integration


## [0.2.0] — 2026-03-23

### 🐛 Bug Fixes

- Request_headers TEXT instead of JSONB (string domain type)


- GORM zero-value update + RowsAffected existence check on Update/Delete


- Rune-aware name length check + exclude user_id from monitor update


- Monitor Delete returns 404 on ErrNotFound


- Swagger @Failure annotation 403->500 on ListUsers


- Import ReactNode type in PrivateRoute


- Named exports + type imports for MonitorTable and UserTable


### 🚀 Features

- Migration 000002 — monitors table


- Add idx_monitors_enabled index


- Monitor domain type + port interfaces


- Monitor repository (GORM)


- RoleGuard middleware with tests


- Monitor usecase with validation + tests


- User usecase (listUsers, updateRole, deleteUser) + tests


- Monitor HTTP handler with Swagger annotations + tests


- User management handler + tests


- Wire monitor + user routes, regenerate swagger


- Monitor domain types + MSW handlers


- UseMonitors + useUsers hooks with tests


- UptimeBar component (CSS grid, 48 equal blocks) + tests


- MonitorModal with conditional fields + tests


- MonitorTable + UserTable components


- Sidebar navigation + PrivateRoute auth guard


- DashboardPage + SettingsPage + protected routing


- Add frontend Docker image + nginx proxy, update docker-compose


## [0.1.0] — 2026-03-22

### 🐛 Bug Fixes

- Fail fast on invalid JWT expiry duration env vars, use log.Fatalf over panic


- Auth usecase — propagate crypto/rand error, nil guard in Refresh, extend test coverage to 80%+


- Expose postgres port 5432 for local development


- Resolve eslint errors — useId, empty catch, react-refresh exports


- Install golangci-lint via go install to support Go 1.26


- Align standalone gosec excludes with golangci.yml config


- Pin golangci-lint to latest to support Go 1.26


- Pass --go=1.24 to golangci-lint to bypass toolchain version check


- Install golangci-lint via go install to support Go 1.26


### 🚀 Features

- Infrastructure — config loader and database connection


- Db migration 001 — users and refresh_tokens tables


- Domain model and port interfaces for auth


- Auth usecase — setup, login, refresh, logout, me (TDD)


- User and token repositories with integration tests


- Jwt, rate limiter, and cors middleware


- Auth handler with swagger annotations and handler tests


- Server wiring, swagger docs, dockerfile — api complete


- Domain types, api client with silent refresh (TDD)


- UseAuth hooks — setup status, login, logout, me (TDD)


- Theme system and shared UI components from mockup


- Setup and login pages with tests


- App router with setup/login redirect flow



