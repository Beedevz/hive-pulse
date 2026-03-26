// @title          HivePulse API
// @version        1.0
// @description    Open-source uptime monitoring platform
// @BasePath       /api/v1
// @securityDefinitions.apikey Bearer
// @in             header
// @name           Authorization
package main

import (
	"context"
	"fmt"
	"log"

	_ "github.com/beedevz/hivepulse/docs"
	"github.com/beedevz/hivepulse/infrastructure"
	"github.com/beedevz/hivepulse/internal/adapter/handler"
	"github.com/beedevz/hivepulse/internal/adapter/middleware"
	"github.com/beedevz/hivepulse/internal/adapter/repo"
	"github.com/beedevz/hivepulse/internal/adapter/service"
	"github.com/beedevz/hivepulse/internal/domain"
	infra "github.com/beedevz/hivepulse/internal/infrastructure"
	"github.com/beedevz/hivepulse/internal/port"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	cfg := infrastructure.LoadConfig()
	infrastructure.RunMigrations(cfg.DatabaseURL)
	db := infrastructure.NewDatabase(cfg.DatabaseURL)

	userRepo := repo.NewUserRepo(db)
	tokenRepo := repo.NewTokenRepo(db)
	authUC := usecase.NewAuthUsecase(
		userRepo, tokenRepo,
		cfg.JWTAccessSecret, cfg.JWTRefreshSecret,
		cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry,
	)
	authHandler := handler.NewAuthHandler(authUC, cfg.JWTRefreshExpiry)

	monitorRepo := repo.NewMonitorRepo(db)
	heartbeatRepo := repo.NewHeartbeatRepo(db)
	incidentRepo := repo.NewIncidentRepo(db)

	hub := infra.NewHub()
	go hub.Run()

	checkerUC := usecase.NewCheckerUsecase(
		monitorRepo,
		heartbeatRepo,
		incidentRepo,
		map[domain.CheckType]port.CheckerService{
			domain.CheckHTTP: service.NewHTTPChecker(),
			domain.CheckTCP:  service.NewTCPChecker(),
			domain.CheckPING: service.NewPINGChecker(),
			domain.CheckDNS:  service.NewDNSChecker(),
		},
		hub,
	)

	scheduler := infra.NewScheduler(checkerUC)
	scheduler.Start()

	ctx := context.Background()
	enabledMonitors, err := monitorRepo.FindAllEnabled(ctx)
	if err != nil {
		log.Printf("warning: could not load monitors for scheduler: %v", err)
	} else {
		for _, m := range enabledMonitors {
			scheduler.Add(m)
		}
	}

	statsRepo := repo.NewStatsRepo(db)
	statsUC := usecase.NewStatsUsecase(statsRepo)

	aggregator := infra.NewAggregator(db)
	go aggregator.Start(ctx)

	notifRepo := repo.NewNotificationRepo(db)
	dispatcher := service.NewNotificationDispatcher(
		service.NewEmailSender(cfg),
		service.NewWebhookSender(),
		service.NewSlackSender(),
	)
	settingsRepo := repo.NewSettingsRepo(db)
	settingsUC := usecase.NewSettingsUsecase(settingsRepo)

	notifUC := usecase.NewNotificationUsecase(notifRepo, dispatcher, monitorRepo, settingsRepo)
	checkerUC.SetNotifier(notifUC)
	aggregator.SetReminder(notifUC)

	sslChecker := infra.NewSSLChecker(monitorRepo, notifUC, notifRepo)
	go sslChecker.Start(ctx)

	notifHandler := handler.NewNotificationHandler(notifUC)

	handler.LoadSMTPFromDB(db, cfg)
	settingsHandler := handler.NewSettingsHandler(db, cfg, settingsUC)

	monitorUC := usecase.NewMonitorUsecase(monitorRepo, scheduler)
	monitorHandler := handler.NewMonitorHandler(monitorUC, heartbeatRepo, statsUC)

	userUC := usecase.NewUserUsecase(userRepo)
	userHandler := handler.NewUserHandler(userUC)

	wsHandler := handler.NewWSHandler(hub)
	incidentHandler := handler.NewIncidentHandler(incidentRepo)

	tagRepo := repo.NewTagRepo(db)
	tagUC := usecase.NewTagUsecase(tagRepo)
	tagHandler := handler.NewTagHandler(tagUC, monitorUC)

	statusPageRepo := repo.NewStatusPageRepo(db)
	statusPageUC := usecase.NewStatusPageUsecase(statusPageRepo, monitorRepo, statsUC, heartbeatRepo, incidentRepo)
	statusPageHandler := handler.NewStatusPageHandler(statusPageUC)

	r := gin.Default()
	r.Use(middleware.CORS(cfg.CORSAllowedOrigins))

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))
	r.GET("/s/:slug", statusPageHandler.GetPublic)
	r.GET("/api/v1/status-pages/public/:slug", statusPageHandler.GetPublic)

	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		auth.GET("/setup/status", authHandler.SetupStatus)
		auth.POST("/setup", authHandler.Setup)
		auth.POST("/login", middleware.RateLimiter("5-M"), authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)

		protected := auth.Group("")
		protected.Use(middleware.JWTAuth(cfg.JWTAccessSecret))
		protected.POST("/logout", authHandler.Logout)
		protected.GET("/me", authHandler.Me)

		jwtAuth := middleware.JWTAuth(cfg.JWTAccessSecret)
		editorGuard := middleware.RoleGuard(domain.RoleEditor, domain.RoleAdmin)
		adminGuard := middleware.RoleGuard(domain.RoleAdmin)

		monitors := v1.Group("/monitors")
		monitors.Use(jwtAuth)
		monitors.GET("", monitorHandler.List)
		monitors.GET("/:id", monitorHandler.Get)
		monitors.GET("/:id/heartbeats", monitorHandler.Heartbeats)
		monitors.GET("/:id/stats", monitorHandler.Stats)
		monitors.POST("", editorGuard, monitorHandler.Create)
		monitors.PUT("/:id", editorGuard, monitorHandler.Update)
		monitors.DELETE("/:id", editorGuard, monitorHandler.Delete)
		monitors.GET("/:id/channels", adminGuard, notifHandler.ListMonitorChannels)
		monitors.POST("/:id/channels/:chID", adminGuard, notifHandler.AssignChannel)
		monitors.DELETE("/:id/channels/:chID", adminGuard, notifHandler.UnassignChannel)
		monitors.PUT("/:id/channels/:channelId/triggers", adminGuard, notifHandler.UpdateAssignmentTriggers)

		notifs := v1.Group("/notification-channels")
		notifs.Use(jwtAuth, adminGuard)
		notifs.GET("", notifHandler.List)
		notifs.POST("", notifHandler.Create)
		notifs.PUT("/:id", notifHandler.Update)
		notifs.DELETE("/:id", notifHandler.Delete)
		notifs.GET("/:id/logs", notifHandler.Logs)
		notifs.POST("/:id/test", notifHandler.TestChannel)

		settings := v1.Group("/settings")
		settings.Use(jwtAuth, adminGuard)
		settings.GET("/smtp", settingsHandler.GetSMTP)
		settings.PUT("/smtp", settingsHandler.PutSMTP)
		settings.GET("/general", settingsHandler.GetGeneral)
		settings.PUT("/general", settingsHandler.PutGeneral)

		incidents := v1.Group("/incidents")
		incidents.Use(jwtAuth)
		incidents.GET("", incidentHandler.List)

		users := v1.Group("/users")
		users.Use(jwtAuth, adminGuard)
		users.GET("", userHandler.ListUsers)
		users.PUT("/:id/role", userHandler.UpdateRole)
		users.DELETE("/:id", userHandler.DeleteUser)

		v1.GET("/ws", jwtAuth, wsHandler.Connect)

		tags := v1.Group("/tags")
		tags.Use(jwtAuth)
		tags.GET("", tagHandler.List)
		tags.POST("", adminGuard, tagHandler.Create)
		tags.DELETE("/:id", adminGuard, tagHandler.Delete)

		monitorTags := v1.Group("/monitors")
		monitorTags.Use(jwtAuth)
		monitorTags.GET("/:id/tags", tagHandler.GetMonitorTags)
		monitorTags.POST("/:id/tags/:tagId", editorGuard, tagHandler.AssignTag)
		monitorTags.DELETE("/:id/tags/:tagId", editorGuard, tagHandler.UnassignTag)

		statusPages := v1.Group("/status-pages")
		statusPages.Use(jwtAuth)
		statusPages.GET("", statusPageHandler.List)
		statusPages.GET("/:id", statusPageHandler.Get)
		statusPages.POST("", adminGuard, statusPageHandler.Create)
		statusPages.PUT("/:id", adminGuard, statusPageHandler.Update)
		statusPages.DELETE("/:id", adminGuard, statusPageHandler.Delete)
	}

	defer scheduler.Stop()

	addr := fmt.Sprintf(":%s", cfg.APIPort)
	log.Printf("HivePulse API starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
