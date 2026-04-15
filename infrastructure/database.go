package infrastructure

import (
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDatabase(databaseURL string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	return db
}

func RunMigrations(databaseURL string) {
	m, err := migrate.New("file://migrations", databaseURL)
	if err != nil {
		log.Fatalf("failed to create migrator: %v", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("migration failed: %v", err)
	}
	log.Println("migrations applied successfully")
}
