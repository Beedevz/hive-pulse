# Changelog

All notable changes to HivePulse are documented here.

## [v0.9.0] — 2026-03-26

### 🚀 New Features

- Add Tag domain, repo, usecase, and handler; assign/unassign tags to monitors ([`133f098`](https://github.com/Beedevz/hivepulse/commit/133f098))
- Add StatusPage domain, repo, usecase, and handler with full CRUD ([`8c67b40`](https://github.com/Beedevz/hivepulse/commit/8c67b40))
- Add public status page endpoint `/api/v1/status-pages/public/:slug` (no auth) ([`a09e5ed`](https://github.com/Beedevz/hivepulse/commit/a09e5ed))
- Add StatusPagesPage, StatusPageModal, StatusPageCard components ([`035b928`](https://github.com/Beedevz/hivepulse/commit/035b928))
- Add PublicStatusPage with HivePulse brand redesign — animated HexIcon glow, HoneycombBg SVG, PulseDot, incident timeline ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Add HoneycombBg shared component with mathematically correct pointy-top hexagons ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Add tag management in MonitorModal edit mode (assign/unassign) ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Add Tag manager to Settings sidebar with color picker ([`578a1d7`](https://github.com/Beedevz/hivepulse/commit/578a1d7))
- Add dark/light theme toggle to TopNav ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Apply HoneycombBg and glass card effect (backdrop-filter blur) to dashboard ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))

### 🐛 Bug Fixes

- Fix StatusPageUsecase.List not populating TagIDs (edit modal showed tags as unselected) ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Fix StatusPage domain structs missing JSON tags (API returned capitalized field names) ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Fix public status page returning raw JSON — remove nginx `/s/` proxy, serve via React Router ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Fix preview/view links using hardcoded `localhost:5173` — use `window.location.origin` ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Fix ResponseTimeChart tooltip using hardcoded dark colors — now theme-aware ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Fix LeftPanel, StatsBar, MonitorDetailSection hardcoded dark colors breaking light theme ([`1b9910f`](https://github.com/Beedevz/hivepulse/commit/1b9910f))
- Replace `math/rand` with `crypto/rand` in slug generator (gosec G404) ([`d275ac0`](https://github.com/Beedevz/hivepulse/commit/d275ac0))
- Resolve XSS CodeQL alert in StatusPageModal preview link ([`7881702`](https://github.com/Beedevz/hivepulse/commit/7881702))

## [v0.8.0] — 2026-03-25

### 🚀 New Features

- Replace sidebar navigation with TopNav + split-panel layout (LeftPanel + detail panel) ([`02c280d`](https://github.com/Beedevz/hivepulse/commit/02c280d))
- Add AppLayout wrapping all private routes via React Router Outlet ([`b4bc012`](https://github.com/Beedevz/hivepulse/commit/b4bc012))
- Add LeftPanel with monitor list, search/filter, and scroll-to-selected ([`07997e3`](https://github.com/Beedevz/hivepulse/commit/07997e3))
- Add MonitorListItem compact rows with UptimeBar, status dot, uptime %, avg ping ([`5644e49`](https://github.com/Beedevz/hivepulse/commit/5644e49))
- Add StatsBar with 4 metric cells: avg uptime, monitors down, active incidents, total monitors ([`e1aa551`](https://github.com/Beedevz/hivepulse/commit/e1aa551))
- Add MonitorDetailSection with stats summary row, heatmap, response time chart, notification channels ([`3ae5770`](https://github.com/Beedevz/hivepulse/commit/3ae5770))
- Add MonitorsPage split-panel layout with mobile-responsive stacking ([`5b1bfef`](https://github.com/Beedevz/hivepulse/commit/5b1bfef))
- Redesign notification channels section: card style, type-coloured chips, filtered assign dropdown ([`e702b14`](https://github.com/Beedevz/hivepulse/commit/e702b14))
- Add CartesianGrid and styled tooltip to ResponseTimeChart ([`e702b14`](https://github.com/Beedevz/hivepulse/commit/e702b14))
- Add card backgrounds to Uptime Heatmap and Response Time sections ([`ea6f0ca`](https://github.com/Beedevz/hivepulse/commit/ea6f0ca))
- Add 30d range to stats API using daily buckets ([`e702b14`](https://github.com/Beedevz/hivepulse/commit/e702b14))

### 🐛 Bug Fixes

- Fix GET /monitors/:id returning uptime_24h: 0 (now queries heartbeats like List) ([`e702b14`](https://github.com/Beedevz/hivepulse/commit/e702b14))
- Fix monitor edit modal showing blank DNS/TCP/HTTP fields (missing fields in monitorResponse) ([`e702b14`](https://github.com/Beedevz/hivepulse/commit/e702b14))
- Fix TopNav status pill always showing green dot; now respects up/down counts ([`7653420`](https://github.com/Beedevz/hivepulse/commit/7653420))
- Fix TopNav status pill using hardcoded dark color instead of theme-safe rgba ([`97bf966`](https://github.com/Beedevz/hivepulse/commit/97bf966))
- Remove unsupported 'slow'/'degraded' status from MonitorListItem and UptimeBar ([`b5bf3ea`](https://github.com/Beedevz/hivepulse/commit/b5bf3ea))
- Resolve lint errors: no-explicit-any in tests, exhaustive-deps in useInitAuth ([`c5bedde`](https://github.com/Beedevz/hivepulse/commit/c5bedde))

### 🗑️ Removed

- Delete orphaned Sidebar, MonitorCard, MonitorTable, DashboardPage, MonitorDetailPage components ([`a8a5455`](https://github.com/Beedevz/hivepulse/commit/a8a5455))

## [v0.7.0] — 2026-03-25

### 🚀 New Features

- Add packet_count and dns_server fields to MonitorModal; show host:port and record_type in MonitorCard ([`7816ae7`](https://github.com/Beedevz/hivepulse/commit/7816ae79f4d38aa6308575f5a05dd6c3011597f3))
## [v0.6.0] — 2026-03-25

### 🐛 Bug Fixes

- Correct ListChannels ORDER BY, ListLogs LIMIT, HasRecentSSLLog interval format ([`56b3423`](https://github.com/Beedevz/hivepulse/commit/56b3423c70ff68581886d9f36f4afb49edb01288))
- Remount ChannelModal on channel change so edit form populates correctly ([`3007382`](https://github.com/Beedevz/hivepulse/commit/30073829d22b250cafbaec1a17308ccc25dd6204))
- Pre-populate webhook URL and slack webhook URL fields when editing a channel ([`72d977e`](https://github.com/Beedevz/hivepulse/commit/72d977ef52a6e49be41b455e5c65b5f37e67efe6))
- Remove unused hexDark/hexLight constants to fix TS6133 build error ([`833551b`](https://github.com/Beedevz/hivepulse/commit/833551bf0f97c800e0965a5c2b0ffde26e740e4c))
- Disable set-state-in-effect lint for SMTP form sync; set TLS MinVersion 1.2 in ssl_checker ([`5de2c9b`](https://github.com/Beedevz/hivepulse/commit/5de2c9b3bb63b8914f96407d3f16d59cd3a455b0))
- Quote user-provided monitorID in log statements to prevent log injection ([`9d1b403`](https://github.com/Beedevz/hivepulse/commit/9d1b403d6690e336ebcb4ba5c8917668c731fd3e))

### 🚀 New Features

- Add notification_channels, monitor_notification_channels, notification_logs migrations ([`986bd64`](https://github.com/Beedevz/hivepulse/commit/986bd643bf73a03c11b3154a8cd7a345920058a8))
- Add notification domain types and port interfaces ([`a08be18`](https://github.com/Beedevz/hivepulse/commit/a08be1827b4daaab9bd5131786ed45f75cba4cde))
- Generate mockery mocks for notification interfaces ([`50ffef0`](https://github.com/Beedevz/hivepulse/commit/50ffef0f43449aba8a8f92469631e0f84ea90927))
- Add NotificationRepo with CRUD, FindReminders, HasRecentSSLLog ([`29f555b`](https://github.com/Beedevz/hivepulse/commit/29f555bf61df4a92e519d16b15a04e3292c7550d))
- Add email, webhook, slack senders and notification dispatcher ([`99cc27a`](https://github.com/Beedevz/hivepulse/commit/99cc27a89331244bac01157a0946e6d7c67cfe2f))
- Add NotificationUsecase with Notify, NotifyReminders, and CRUD ([`f1effd4`](https://github.com/Beedevz/hivepulse/commit/f1effd483cc707bb67538614c04b1b06193aa039))
- Integrate Notifier into CheckerUsecase via SetNotifier setter ([`9c0848e`](https://github.com/Beedevz/hivepulse/commit/9c0848e94d61158d1aa2a20d9157376b8eb4d986))
- Add SetReminder to Aggregator; fire NotifyReminders after DB transaction ([`03c0b56`](https://github.com/Beedevz/hivepulse/commit/03c0b56ad85076b0486818c105b50681d5ed8019))
- Add SSLChecker that fires ssl_expiry notifications with 24h deduplication ([`9eadc3a`](https://github.com/Beedevz/hivepulse/commit/9eadc3a38802ae9e94810763b928c07cfd266c50))
- Add SMTP config fields; wire EmailSender to use infrastructure.Config ([`68f4f27`](https://github.com/Beedevz/hivepulse/commit/68f4f274b07a3eb13854de665c744636ee1a3947))
- Add NotificationHandler with CRUD, logs, and monitor channel assignment ([`f9701f0`](https://github.com/Beedevz/hivepulse/commit/f9701f0c40c9e623f0b73f80378dd10140b649a1))
- Wire notification engine into main.go; add /notification-channels routes; regen swagger ([`b4c623d`](https://github.com/Beedevz/hivepulse/commit/b4c623d0e36f89c696d52d7378c6ff6363039a56))
- Add notification domain types, useNotifications hooks, and MSW handlers ([`e09ab1b`](https://github.com/Beedevz/hivepulse/commit/e09ab1ba41b3d45d1718225f6fdb3085fb3c30e8))
- Add ChannelCard and ChannelModal components with tests ([`ac0ee7b`](https://github.com/Beedevz/hivepulse/commit/ac0ee7b747ec21f85266d716c1e1510042693aea))
- Add Notifications tab to SettingsPage with channel CRUD ([`3ba7dc2`](https://github.com/Beedevz/hivepulse/commit/3ba7dc2e94635c1bf5d3f0e040f0910a5272ab62))
- Add notification channel override section to MonitorDetailPage (admin only) ([`1f3c133`](https://github.com/Beedevz/hivepulse/commit/1f3c1332cf92d85be21c33eb352604cd9d4e3056))
- Add SMTP settings API and test notification endpoint ([`b3caa03`](https://github.com/Beedevz/hivepulse/commit/b3caa0378a6a1d2c4533bc67492d57425f61e247))
- Add SMTP settings form, is-global tooltip, and test notification button ([`e5d4d70`](https://github.com/Beedevz/hivepulse/commit/e5d4d7083588716355b7957b770e525a8b68b6eb))
## [v0.5.0] — 2026-03-24

### 🐛 Bug Fixes

- Use type-only imports for verbatimModuleSyntax compliance ([`e94d6c0`](https://github.com/Beedevz/hivepulse/commit/e94d6c00c27e7a069f6bff00fdaac155162b2d24))

### 🚀 New Features

- Add stats_hourly and stats_daily migrations ([`1955970`](https://github.com/Beedevz/hivepulse/commit/1955970df09995cd5a1b32b5f74190a0bc05abbd))
- Add StatsBucket domain type and StatsRepository port interface ([`e38fb3b`](https://github.com/Beedevz/hivepulse/commit/e38fb3b547aec01361f51ae1204f1843ea42043a))
- Add StatsRepo GORM adapter ([`bdb00be`](https://github.com/Beedevz/hivepulse/commit/bdb00be4f7a8f08953da674d0de2860e37150e35))
- Add StatsUsecase with GetStats and unit tests ([`989c457`](https://github.com/Beedevz/hivepulse/commit/989c457c8eb22de4f305c110d31f67b6566c4f53))
- Add StatsService interface and Stats handler to MonitorHandler ([`fd5f73b`](https://github.com/Beedevz/hivepulse/commit/fd5f73b78d2f83372df583cf5d0684e90ec94a2b))
- Add aggregator goroutine and integration test ([`0ece606`](https://github.com/Beedevz/hivepulse/commit/0ece606993ab46d10c9c1b0f20478dcf2300b384))
- Wire statsRepo, statsUsecase, aggregator, and stats route in main.go; regen swagger ([`2ca6691`](https://github.com/Beedevz/hivepulse/commit/2ca669162152e183310df4e404e17facf1e8aadc))
- Add StatsResponse types and useStats hook ([`acb1d96`](https://github.com/Beedevz/hivepulse/commit/acb1d963c506506aae88282351254e78c27153ee))
- Add UptimeHeatmap component with gradient color coding ([`038656c`](https://github.com/Beedevz/hivepulse/commit/038656c887875f12ecca7f24ad5b700f5dc4dbce))
- Add ResponseTimeChart component using recharts ([`d2efd1e`](https://github.com/Beedevz/hivepulse/commit/d2efd1e2fdda4e835be0d0ec68a7b28cf29ae1e9))
- Add MonitorDetailPage with uptime heatmap and response time chart ([`4b482ad`](https://github.com/Beedevz/hivepulse/commit/4b482adacc6b8cef5a8b7ee12ec74737926d7180))
## [v0.4.0] — 2026-03-24

### 🐛 Bug Fixes

- Remove unused imports in MonitorCard test ([`2b8eba2`](https://github.com/Beedevz/hivepulse/commit/2b8eba264b7981781aa8cdb5284bf10c997fb062))
- Constrain card max-width and improve card visual styling ([`91edf4a`](https://github.com/Beedevz/hivepulse/commit/91edf4a9fa7ee6b55eb77c420e2f1fdc8be87b8c))
- Resolve CI lint errors and regenerate swagger docs ([`c2c347e`](https://github.com/Beedevz/hivepulse/commit/c2c347e0512dbdbb84b434c71d4e6e169f2631ea))
- Sanitize monitorID in log statements to prevent log injection (CWE-117) ([`aae97e0`](https://github.com/Beedevz/hivepulse/commit/aae97e0614cc6d0c2b569616e14b18289b255482))

### 🚀 New Features

- Add last_status column and incidents table migrations ([`186908d`](https://github.com/Beedevz/hivepulse/commit/186908d4367239d89bf097103b2861ba0d7f61b3))
- Add Incident domain type and IncidentRepository + UpdateLastStatus port ([`4c8314f`](https://github.com/Beedevz/hivepulse/commit/4c8314f4b5fcadc16eb0d61febebae746b15b464))
- Add last_status field and UpdateLastStatus to monitor repo ([`21549e6`](https://github.com/Beedevz/hivepulse/commit/21549e6ee2e140920c01501e87f8a73a4c328887))
- Add IncidentRepo with GORM implementation and integration tests ([`d7cfe85`](https://github.com/Beedevz/hivepulse/commit/d7cfe85546de5c7089cb276f8ad386624ebbe851))
- Regenerate MonitorRepository mock and add IncidentRepository mock ([`89d421a`](https://github.com/Beedevz/hivepulse/commit/89d421a3caa4797527e28cf59778269e49c2ffea))
- Add incident transition logic to CheckerUsecase ([`eb38928`](https://github.com/Beedevz/hivepulse/commit/eb3892852c39031646ff593aaa7ddfbf86d3e5f1))
- Use stored last_status from monitor domain in handler ([`17dccba`](https://github.com/Beedevz/hivepulse/commit/17dccbad52077fb02479ae0aad179bffeb12edac))
- Add incident handler and wire into server ([`9a1c1a8`](https://github.com/Beedevz/hivepulse/commit/9a1c1a847eef258295f9fa08fe321e99d7be1c67))
- Add Incident domain type, useIncidents hook, and MSW handler ([`29cf5a7`](https://github.com/Beedevz/hivepulse/commit/29cf5a7027290db7e0307f8101b684449c125836))
- Add MonitorCard component with UptimeBar, sparkline, and shake animation ([`65b7f4f`](https://github.com/Beedevz/hivepulse/commit/65b7f4f30805b39776ef2b5c38cc0da9c88354b7))
- Add MonitorSearch and replace MonitorTable with MonitorCard in DashboardPage ([`e54f611`](https://github.com/Beedevz/hivepulse/commit/e54f6116f8181b652a380102f5c7fce90272f0ba))
- Add AlertsPage, Alerts nav link, and /alerts route ([`cd19cde`](https://github.com/Beedevz/hivepulse/commit/cd19cdebe1395ff2e2dea687f5689e80cc40d84d))
- Redesign sidebar, dashboard layout, and alerts page UI ([`47e6279`](https://github.com/Beedevz/hivepulse/commit/47e6279091e6f89edaf354fd8357d2ac665cc1d8))
- Apply HivePulse design system — typography, colors, honeycomb bg ([`d5136af`](https://github.com/Beedevz/hivepulse/commit/d5136af14da4e759023ccc0043df81efaa56882e))
## [v0.3.0] — 2026-03-23

### 🐛 Bug Fixes

- Handle errcheck + gosimple lint warnings in checker usecase and ws hub ([`56ddbe9`](https://github.com/Beedevz/hivepulse/commit/56ddbe9c529db8018b5ae30907511dd040f1f607))
- Add WebSocket upgrade headers to nginx proxy config ([`595bea3`](https://github.com/Beedevz/hivepulse/commit/595bea39516525ebbfead8f8b065571f0398d40b))

### 🚀 New Features

- Add websocket/cron/probing deps + heartbeats migration ([`661cc04`](https://github.com/Beedevz/hivepulse/commit/661cc04caa487238ff426dc34d9194149a3728c1))
- Add websocket/cron/probing deps to go.mod ([`43656c8`](https://github.com/Beedevz/hivepulse/commit/43656c846b0379671c2303d470a227352019b483))
- Heartbeat domain type + port interfaces (CheckerService, CheckRunner, WSBroadcaster, SchedulerService, HeartbeatRepository) ([`2d1454e`](https://github.com/Beedevz/hivepulse/commit/2d1454e985b710461d51a06c20c3246792d579d6))
- Heartbeat repository + MonitorRepo.FindAllEnabled ([`a43f0a1`](https://github.com/Beedevz/hivepulse/commit/a43f0a1fa4214043a08bd865199882e53e0c5cde))
- Generate mocks for CheckerService, CheckRunner, WSBroadcaster, SchedulerService, HeartbeatRepository + regenerate MonitorRepository ([`1b30e42`](https://github.com/Beedevz/hivepulse/commit/1b30e42c7a151a1117d24ce6770ac26ac093b31e))
- HTTP checker adapter with tests ([`7f5488a`](https://github.com/Beedevz/hivepulse/commit/7f5488af6d0cbb8c614f6996d01754da3a9d4595))
- TCP checker adapter with tests ([`696d971`](https://github.com/Beedevz/hivepulse/commit/696d9712b3e5512ca9c5075e60f172db1103b3e4))
- PING checker adapter with tests ([`4e6b43c`](https://github.com/Beedevz/hivepulse/commit/4e6b43ccd4c6df6d3dd429ccb3df3cea4cf7486a))
- DNS checker adapter with tests ([`8fbe8b4`](https://github.com/Beedevz/hivepulse/commit/8fbe8b42c27da2f02a83810c2326c5fa276b2c7b))
- Checker usecase (RunCheck with retry + broadcast) ([`88444e2`](https://github.com/Beedevz/hivepulse/commit/88444e28c4b8f302f848fbef754a3e5cf646eb3f))
- WebSocket hub with broadcast + test client helper ([`d3be87d`](https://github.com/Beedevz/hivepulse/commit/d3be87d9eb6821989db4e26bddbea4e0c20e33e0))
- Cron scheduler (Add/Remove/Update + Start/Stop) ([`348cbbd`](https://github.com/Beedevz/hivepulse/commit/348cbbdeeb10a3fee4399a5e611b5e831fc83309))
- WebSocket handler + JWT query param fallback for WS connections ([`7f9be94`](https://github.com/Beedevz/hivepulse/commit/7f9be941e27515aed7622bb64222547e18f09b34))
- MonitorUsecase scheduler integration + MonitorHandler real stats + heartbeats endpoint ([`d02aa93`](https://github.com/Beedevz/hivepulse/commit/d02aa939ba96e93534980dbf80961c17814da336))
- Wire WebSocket route + startup scheduler seeding + graceful shutdown ([`3db815a`](https://github.com/Beedevz/hivepulse/commit/3db815a62faef40709689c6a793b8272594857aa))
- WebSocket client (exponential backoff) + useWebSocket hook with React Query cache patching ([`1e64eb2`](https://github.com/Beedevz/hivepulse/commit/1e64eb2bc6126c4774eb97f611231cdbe9a67a59))
- UseHeartbeats hook + DashboardPage WebSocket integration ([`cd93049`](https://github.com/Beedevz/hivepulse/commit/cd9304935061d29bc90554eba38e6c565f0ea094))
## [v0.2.0] — 2026-03-23

### 🐛 Bug Fixes

- Request_headers TEXT instead of JSONB (string domain type) ([`15fb4d5`](https://github.com/Beedevz/hivepulse/commit/15fb4d58e2f02f7d391583be5001f7543b217573))
- GORM zero-value update + RowsAffected existence check on Update/Delete ([`4ec97a6`](https://github.com/Beedevz/hivepulse/commit/4ec97a6efff9a1e06d4116317680e2eb244b1e8c))
- Rune-aware name length check + exclude user_id from monitor update ([`218cd08`](https://github.com/Beedevz/hivepulse/commit/218cd08113e0b3022480f3f651b8225593f82c54))
- Monitor Delete returns 404 on ErrNotFound ([`d064f45`](https://github.com/Beedevz/hivepulse/commit/d064f4582e0e75894818e3016f6748e50873c3f6))
- Swagger @Failure annotation 403->500 on ListUsers ([`99fa32e`](https://github.com/Beedevz/hivepulse/commit/99fa32e563de92d2c5253e76c1b345a573de0292))
- Import ReactNode type in PrivateRoute ([`fd69474`](https://github.com/Beedevz/hivepulse/commit/fd694747e87c3ed848e543ebb0483fbc0b01d446))
- Named exports + type imports for MonitorTable and UserTable ([`dede88d`](https://github.com/Beedevz/hivepulse/commit/dede88dc2705ff59e0930db2aa73b8b85eef4dfc))

### 🚀 New Features

- Migration 000002 — monitors table ([`52ff7fc`](https://github.com/Beedevz/hivepulse/commit/52ff7fcd1d885d06b32f3d5f048a90842279890a))
- Add idx_monitors_enabled index ([`1cd894e`](https://github.com/Beedevz/hivepulse/commit/1cd894e9b179de89b17c567595ce4a298090d9f0))
- Monitor domain type + port interfaces ([`0e4d740`](https://github.com/Beedevz/hivepulse/commit/0e4d740bc0e047d2d702de682ed6f88ba73d8407))
- Monitor repository (GORM) ([`c499e96`](https://github.com/Beedevz/hivepulse/commit/c499e96fc23265605612ef8611b9b60836feafa0))
- RoleGuard middleware with tests ([`ee49a4f`](https://github.com/Beedevz/hivepulse/commit/ee49a4fa81699af6fa0e6b056723b22b71ca9e6f))
- Monitor usecase with validation + tests ([`a476b73`](https://github.com/Beedevz/hivepulse/commit/a476b7335bdc56047e0f04ddd293d39297a78afb))
- User usecase (listUsers, updateRole, deleteUser) + tests ([`a181467`](https://github.com/Beedevz/hivepulse/commit/a181467c2b97633b8ab2b002009ea389cacebee1))
- Monitor HTTP handler with Swagger annotations + tests ([`7b0de07`](https://github.com/Beedevz/hivepulse/commit/7b0de07aad0a0620e10fd54c32665ef5acb42c9f))
- User management handler + tests ([`05a9e2c`](https://github.com/Beedevz/hivepulse/commit/05a9e2cc53a43b381d1d770de04b8a1f69ceee4f))
- Wire monitor + user routes, regenerate swagger ([`dd646c0`](https://github.com/Beedevz/hivepulse/commit/dd646c0f431767e96244ac9f0b01dcb9dc4c052e))
- Monitor domain types + MSW handlers ([`6aa18d2`](https://github.com/Beedevz/hivepulse/commit/6aa18d2f44fc98280e207dbec1dde28ea1402d0c))
- UseMonitors + useUsers hooks with tests ([`71358e4`](https://github.com/Beedevz/hivepulse/commit/71358e4970aab109f168c4182de98fb2e5f0f3e4))
- UptimeBar component (CSS grid, 48 equal blocks) + tests ([`934d0b3`](https://github.com/Beedevz/hivepulse/commit/934d0b32f0fa9909096ee3d69a3130f8f2b7855a))
- MonitorModal with conditional fields + tests ([`9feb2f7`](https://github.com/Beedevz/hivepulse/commit/9feb2f70afdffdc3e2570af9604a59bfa2e9c317))
- MonitorTable + UserTable components ([`977cece`](https://github.com/Beedevz/hivepulse/commit/977cece171aeabeb32ef80dabc995623b7e89e53))
- Sidebar navigation + PrivateRoute auth guard ([`290e42a`](https://github.com/Beedevz/hivepulse/commit/290e42ae1cea7998e411f57adb174676ce769fbf))
- DashboardPage + SettingsPage + protected routing ([`111809d`](https://github.com/Beedevz/hivepulse/commit/111809d38761d7475317c798a39a8a6146bcd096))
- Add frontend Docker image + nginx proxy, update docker-compose ([`a46ba44`](https://github.com/Beedevz/hivepulse/commit/a46ba44daadc880b92370b07e40993b78ed8d540))
## [v0.1.0] — 2026-03-22

### 🐛 Bug Fixes

- Fail fast on invalid JWT expiry duration env vars, use log.Fatalf over panic ([`ce7d758`](https://github.com/Beedevz/hivepulse/commit/ce7d758d99191111f54c7acce3f8d681e3abcacd))
- Auth usecase — propagate crypto/rand error, nil guard in Refresh, extend test coverage to 80%+ ([`69a6076`](https://github.com/Beedevz/hivepulse/commit/69a6076c8b019fc0e621fbc1e3445439f6dca0ad))
- Expose postgres port 5432 for local development ([`7d478c6`](https://github.com/Beedevz/hivepulse/commit/7d478c67a29dc40ff771f67fa0cbb5803edebde2))
- Resolve eslint errors — useId, empty catch, react-refresh exports ([`c1f0b67`](https://github.com/Beedevz/hivepulse/commit/c1f0b67d41574b904e86c5ed04f5813648e30a31))
- Install golangci-lint via go install to support Go 1.26 ([`c750c37`](https://github.com/Beedevz/hivepulse/commit/c750c37f7212ac58082dfb6107b61bb4e022aab0))
- Align standalone gosec excludes with golangci.yml config ([`8efaee5`](https://github.com/Beedevz/hivepulse/commit/8efaee5bf94c45e70d3541d0f2ed235eca3f5da9))
- Pin golangci-lint to latest to support Go 1.26 ([`6562029`](https://github.com/Beedevz/hivepulse/commit/6562029826bfb32b122f451a2421adf061297831))
- Pass --go=1.24 to golangci-lint to bypass toolchain version check ([`2785fa2`](https://github.com/Beedevz/hivepulse/commit/2785fa20c57576a3838912609d84b9673fc6ab70))
- Install golangci-lint via go install to support Go 1.26 ([`b33820d`](https://github.com/Beedevz/hivepulse/commit/b33820d5515d46c8a3080922aa1df4a2478e7d14))

### 🚀 New Features

- Infrastructure — config loader and database connection ([`1c858af`](https://github.com/Beedevz/hivepulse/commit/1c858afd628cba0fe7741ff47cdd43cc2ba2d791))
- Db migration 001 — users and refresh_tokens tables ([`7d21cf3`](https://github.com/Beedevz/hivepulse/commit/7d21cf3985246f448d8ab75076494424db824fff))
- Domain model and port interfaces for auth ([`6866c68`](https://github.com/Beedevz/hivepulse/commit/6866c686a0206665e478fdcfa9e02833ecab4643))
- Auth usecase — setup, login, refresh, logout, me (TDD) ([`150dd02`](https://github.com/Beedevz/hivepulse/commit/150dd0279ff44f67edb4c7c6c41d984a6f655fa9))
- User and token repositories with integration tests ([`04ec1e9`](https://github.com/Beedevz/hivepulse/commit/04ec1e95ff9d7e86faa1221a957532814e73af5c))
- Jwt, rate limiter, and cors middleware ([`68017cb`](https://github.com/Beedevz/hivepulse/commit/68017cbb98cb2f8ccf22b18e8c382d68cc6acf8c))
- Auth handler with swagger annotations and handler tests ([`b0dc99b`](https://github.com/Beedevz/hivepulse/commit/b0dc99b79c72c9d41d6adc4211bfa65c7d128212))
- Server wiring, swagger docs, dockerfile — api complete ([`08d02ad`](https://github.com/Beedevz/hivepulse/commit/08d02ad2366888d243b44c351baa4f6809a7397b))
- Domain types, api client with silent refresh (TDD) ([`8e60e0a`](https://github.com/Beedevz/hivepulse/commit/8e60e0a1995839438eed7b9a21b382e356fc03af))
- UseAuth hooks — setup status, login, logout, me (TDD) ([`794320b`](https://github.com/Beedevz/hivepulse/commit/794320b1cb637b51b611551c2c3224ee11e18502))
- Theme system and shared UI components from mockup ([`563d51b`](https://github.com/Beedevz/hivepulse/commit/563d51b21fbddd0e1964aff718030e18e97e0425))
- Setup and login pages with tests ([`3ff0de0`](https://github.com/Beedevz/hivepulse/commit/3ff0de0c3a454511f418d8ce50e7ca4902adfc3a))
- App router with setup/login redirect flow ([`cf61b63`](https://github.com/Beedevz/hivepulse/commit/cf61b63988fdd8f692f9c3498cae80bd8e288200))

