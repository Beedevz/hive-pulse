// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package service_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/beedevz/hivepulse/internal/adapter/service"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/stretchr/testify/assert"
)

func TestHTTPChecker_Up(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	checker := service.NewHTTPChecker()
	m := &domain.Monitor{
		CheckType:      domain.CheckHTTP,
		URL:            srv.URL,
		Method:         "GET",
		ExpectedStatus: 200,
		Timeout:        10,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "up", hb.Status)
	assert.Equal(t, 200, hb.StatusCode)
	assert.Greater(t, hb.PingMS, 0)
	assert.False(t, hb.CheckedAt.IsZero())
}

func TestHTTPChecker_Down_WrongStatus(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	checker := service.NewHTTPChecker()
	m := &domain.Monitor{
		CheckType:      domain.CheckHTTP,
		URL:            srv.URL,
		Method:         "GET",
		ExpectedStatus: 200,
		Timeout:        10,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "down", hb.Status)
	assert.Equal(t, 500, hb.StatusCode)
}

func TestHTTPChecker_Down_Unreachable(t *testing.T) {
	checker := service.NewHTTPChecker()
	m := &domain.Monitor{
		CheckType:      domain.CheckHTTP,
		URL:            "http://127.0.0.1:19999",
		Method:         "GET",
		ExpectedStatus: 200,
		Timeout:        1,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err) // never returns error — always returns heartbeat
	assert.Equal(t, "down", hb.Status)
	assert.NotEmpty(t, hb.ErrorMsg)
}

func TestHTTPChecker_KeywordFound_Up(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok","version":"1.0"}`))
	}))
	defer srv.Close()

	checker := service.NewHTTPChecker()
	m := &domain.Monitor{
		CheckType: domain.CheckHTTP, URL: srv.URL, Method: "GET",
		ExpectedStatus: 200, Timeout: 10, ExpectedKeyword: `"status":"ok"`,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "up", hb.Status)
}

func TestHTTPChecker_KeywordNotFound_Down(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"degraded"}`))
	}))
	defer srv.Close()

	checker := service.NewHTTPChecker()
	m := &domain.Monitor{
		CheckType: domain.CheckHTTP, URL: srv.URL, Method: "GET",
		ExpectedStatus: 200, Timeout: 10, ExpectedKeyword: `"status":"ok"`,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "down", hb.Status)
	assert.Contains(t, hb.ErrorMsg, "keyword")
	assert.Contains(t, hb.ErrorMsg, "not found")
}

func TestHTTPChecker_KeywordEmpty_SkipsBodyCheck(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`anything`))
	}))
	defer srv.Close()

	checker := service.NewHTTPChecker()
	m := &domain.Monitor{
		CheckType: domain.CheckHTTP, URL: srv.URL, Method: "GET",
		ExpectedStatus: 200, Timeout: 10, ExpectedKeyword: "",
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "up", hb.Status)
}

func TestHTTPChecker_WrongStatus_SkipsKeyword(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`"status":"ok"`))
	}))
	defer srv.Close()

	checker := service.NewHTTPChecker()
	m := &domain.Monitor{
		CheckType: domain.CheckHTTP, URL: srv.URL, Method: "GET",
		ExpectedStatus: 200, Timeout: 10, ExpectedKeyword: `"status":"ok"`,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "down", hb.Status)
	assert.Contains(t, hb.ErrorMsg, "expected status 200")
}
