package service

import (
	"context"
	"fmt"
	"log"
	"net/smtp"

	"github.com/beedevz/hivepulse/internal/domain"
)

// SMTPConfig holds SMTP connection settings.
// These will be wired from infrastructure.Config once SMTP fields are added (Task 10).
type SMTPConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	From     string
}

type EmailSender struct{ cfg SMTPConfig }

func NewEmailSender(cfg SMTPConfig) *EmailSender { return &EmailSender{cfg: cfg} }

func (s *EmailSender) Send(_ context.Context, ch *domain.NotificationChannel, event domain.NotificationEvent, monitor *domain.Monitor) error {
	if s.cfg.Host == "" {
		log.Printf("email_sender: SMTP not configured, skipping notification for monitor %s", monitor.ID)
		return nil
	}
	to := ch.Config["to"]
	subject, body := formatEmail(event, monitor)
	msg := fmt.Sprintf("To: %s\r\nSubject: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s", to, subject, body)
	addr := fmt.Sprintf("%s:%d", s.cfg.Host, s.cfg.Port)
	auth := smtp.PlainAuth("", s.cfg.User, s.cfg.Password, s.cfg.Host)
	return smtp.SendMail(addr, auth, s.cfg.From, []string{to}, []byte(msg))
}

func formatEmail(event domain.NotificationEvent, monitor *domain.Monitor) (subject, body string) {
	switch event {
	case domain.EventDown:
		subject = fmt.Sprintf("[HivePulse] ALERT: %s is DOWN", monitor.Name)
		body = fmt.Sprintf("Monitor %s (%s) is DOWN.\n\nCheck your HivePulse dashboard for details.", monitor.Name, monitor.ID)
	case domain.EventUp:
		subject = fmt.Sprintf("[HivePulse] RESOLVED: %s is UP", monitor.Name)
		body = fmt.Sprintf("Monitor %s (%s) has recovered and is UP.", monitor.Name, monitor.ID)
	case domain.EventSSLExpiry:
		subject = fmt.Sprintf("[HivePulse] SSL WARNING: %s certificate expiring soon", monitor.Name)
		body = fmt.Sprintf("Monitor %s (%s): SSL certificate is expiring soon.\nCheck your HivePulse dashboard for days remaining.", monitor.Name, monitor.ID)
	}
	return
}
