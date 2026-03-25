package usecase

import (
	"context"
	"fmt"
	"math/rand"
	"regexp"
	"strings"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

var nonAlphanumRe = regexp.MustCompile(`[^a-z0-9]+`)

type StatusPageRequest struct {
	Title        string
	Slug         string // optional; auto-generated if empty
	Description  string
	LogoURL      string
	AccentColor  string
	CustomDomain string
	TagIDs       []string
}

// StatsServiceForPage is a narrow interface to avoid import cycles.
type StatsServiceForPage interface {
	GetStats(ctx context.Context, monitorID, rangeStr string) (*domain.StatsResponse, error)
}

type StatusPageUsecase struct {
	repo          port.StatusPageRepository
	monitorRepo   port.MonitorRepository
	statsUC       StatsServiceForPage
	heartbeatRepo port.HeartbeatRepository
	incidentRepo  port.IncidentRepository
}

func NewStatusPageUsecase(
	repo port.StatusPageRepository,
	monitorRepo port.MonitorRepository,
	statsUC StatsServiceForPage,
	heartbeatRepo port.HeartbeatRepository,
	incidentRepo port.IncidentRepository,
) *StatusPageUsecase {
	return &StatusPageUsecase{
		repo: repo, monitorRepo: monitorRepo, statsUC: statsUC,
		heartbeatRepo: heartbeatRepo, incidentRepo: incidentRepo,
	}
}

func generateSlug(title string) string {
	lower := strings.ToLower(title)
	clean := nonAlphanumRe.ReplaceAllString(lower, "-")
	clean = strings.Trim(clean, "-")
	if clean == "" {
		clean = "status"
	}
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	suffix := make([]byte, 4)
	for i := range suffix {
		suffix[i] = chars[rand.Intn(len(chars))]
	}
	return clean + "-" + string(suffix)
}

func (u *StatusPageUsecase) Create(ctx context.Context, req StatusPageRequest) (*domain.StatusPage, error) {
	if strings.TrimSpace(req.Title) == "" {
		return nil, fmt.Errorf("%w: title is required", domain.ErrValidation)
	}
	slug := req.Slug
	if slug == "" {
		slug = generateSlug(req.Title)
	}
	exists, err := u.repo.SlugExists(ctx, slug, "")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("%w: slug '%s' is already taken", domain.ErrValidation, slug)
	}
	if req.AccentColor == "" {
		req.AccentColor = "#F5A623"
	}
	sp := &domain.StatusPage{
		Slug:         slug,
		Title:        req.Title,
		Description:  req.Description,
		LogoURL:      req.LogoURL,
		AccentColor:  req.AccentColor,
		CustomDomain: req.CustomDomain,
	}
	if err := u.repo.Create(ctx, sp); err != nil {
		return nil, err
	}
	if len(req.TagIDs) > 0 {
		_ = u.repo.SetTags(ctx, sp.ID, req.TagIDs)
	}
	sp.TagIDs = req.TagIDs
	return sp, nil
}

func (u *StatusPageUsecase) Update(ctx context.Context, id string, req StatusPageRequest) (*domain.StatusPage, error) {
	sp, err := u.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("%w", domain.ErrNotFound)
	}
	if req.Slug != "" && req.Slug != sp.Slug {
		exists, _ := u.repo.SlugExists(ctx, req.Slug, id)
		if exists {
			return nil, fmt.Errorf("%w: slug '%s' is already taken", domain.ErrValidation, req.Slug)
		}
		sp.Slug = req.Slug
	}
	sp.Title = req.Title
	sp.Description = req.Description
	sp.LogoURL = req.LogoURL
	sp.AccentColor = req.AccentColor
	sp.CustomDomain = req.CustomDomain
	sp.UpdatedAt = time.Now()
	if err := u.repo.Update(ctx, sp); err != nil {
		return nil, err
	}
	_ = u.repo.SetTags(ctx, sp.ID, req.TagIDs)
	sp.TagIDs = req.TagIDs
	return sp, nil
}

func (u *StatusPageUsecase) Delete(ctx context.Context, id string) error {
	if _, err := u.repo.FindByID(ctx, id); err != nil {
		return fmt.Errorf("%w", domain.ErrNotFound)
	}
	return u.repo.Delete(ctx, id)
}

func (u *StatusPageUsecase) List(ctx context.Context, page, limit int) ([]*domain.StatusPage, int64, error) {
	return u.repo.List(ctx, page, limit)
}

func (u *StatusPageUsecase) GetByID(ctx context.Context, id string) (*domain.StatusPage, error) {
	sp, err := u.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("%w", domain.ErrNotFound)
	}
	sp.TagIDs, _ = u.repo.GetTagIDs(ctx, id)
	return sp, nil
}

func (u *StatusPageUsecase) GetPublic(ctx context.Context, slug string) (*domain.PublicStatusPageData, error) {
	sp, err := u.repo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, fmt.Errorf("%w", domain.ErrNotFound)
	}
	tagIDs, _ := u.repo.GetTagIDs(ctx, sp.ID)
	var monitors []*domain.Monitor
	if len(tagIDs) > 0 && u.monitorRepo != nil {
		monitors, _ = u.monitorRepo.FindByTagIDs(ctx, tagIDs)
	}

	monitorIDs := make(map[string]bool, len(monitors))
	monitorRows := make([]domain.PublicMonitorRow, 0, len(monitors))
	for _, m := range monitors {
		monitorIDs[m.ID] = true
		row := domain.PublicMonitorRow{
			ID:         m.ID,
			Name:       m.Name,
			CheckType:  string(m.CheckType),
			LastStatus: m.LastStatus,
		}
		if u.heartbeatRepo != nil {
			upCount, total, err := u.heartbeatRepo.GetUptime(ctx, m.ID, time.Now().Add(-24*time.Hour))
			if err == nil && total > 0 {
				row.Uptime24h = float64(upCount) / float64(total)
			}
		}
		if u.statsUC != nil {
			if stats90d, err := u.statsUC.GetStats(ctx, m.ID, "90d"); err == nil {
				row.Uptime90d = stats90d.UptimePct / 100.0
				buckets := make([]domain.DailyBucket, 0, len(stats90d.Buckets))
				for _, b := range stats90d.Buckets {
					pct := 0.0
					if b.TotalCount > 0 {
						pct = float64(b.UpCount) / float64(b.TotalCount)
					}
					buckets = append(buckets, domain.DailyBucket{
						Date:      b.Time.Format("2006-01-02"),
						UptimePct: pct,
					})
				}
				row.DailyBuckets = buckets
			}
		}
		monitorRows = append(monitorRows, row)
	}

	overall := computeOverallStatus(monitorRows)

	var activeIncidents, recentIncidents []domain.PublicIncident
	if u.incidentRepo != nil {
		if active, err := u.incidentRepo.FindActive(ctx); err == nil {
			for _, inc := range active {
				if monitorIDs[inc.MonitorID] {
					activeIncidents = append(activeIncidents, domain.PublicIncident{
						ID:          fmt.Sprintf("%d", inc.ID),
						MonitorName: inc.MonitorName,
						StartedAt:   inc.StartedAt,
						ErrorMsg:    inc.ErrorMsg,
					})
				}
			}
		}
		if resolved, err := u.incidentRepo.FindResolved(ctx, 50); err == nil {
			for _, inc := range resolved {
				if monitorIDs[inc.MonitorID] && len(recentIncidents) < 10 {
					durationS := 0
					if inc.ResolvedAt != nil {
						durationS = int(inc.ResolvedAt.Sub(inc.StartedAt).Seconds())
					}
					recentIncidents = append(recentIncidents, domain.PublicIncident{
						ID:          fmt.Sprintf("%d", inc.ID),
						MonitorName: inc.MonitorName,
						StartedAt:   inc.StartedAt,
						ResolvedAt:  inc.ResolvedAt,
						DurationS:   durationS,
						ErrorMsg:    inc.ErrorMsg,
					})
				}
			}
		}
	}
	if activeIncidents == nil {
		activeIncidents = []domain.PublicIncident{}
	}
	if recentIncidents == nil {
		recentIncidents = []domain.PublicIncident{}
	}

	return &domain.PublicStatusPageData{
		Title:           sp.Title,
		Description:     sp.Description,
		AccentColor:     sp.AccentColor,
		LogoURL:         sp.LogoURL,
		OverallStatus:   overall,
		Monitors:        monitorRows,
		ActiveIncidents: activeIncidents,
		RecentIncidents: recentIncidents,
	}, nil
}

func computeOverallStatus(monitors []domain.PublicMonitorRow) string {
	for _, m := range monitors {
		if m.LastStatus == "down" {
			return "outage"
		}
	}
	for _, m := range monitors {
		if m.LastStatus == "unknown" {
			return "degraded"
		}
	}
	return "operational"
}
