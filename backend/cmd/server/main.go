package main

import (
	"amar-dera/config"
	"amar-dera/internal/core/services"
	"amar-dera/internal/handlers"
	"amar-dera/internal/infra/db"
	"amar-dera/internal/repositories/mongo"
	"amar-dera/internal/router"
	"log"
)

func main() {
	// Load Configuration
	cfg := config.LoadConfig()

	// Connect to Database
	database, err := db.Connect(cfg.MongoURI, cfg.DBName)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Disconnect()

	// --- Repositories ---
	userRepo := mongo.NewUserRepository(database.Database)
	messRepo := mongo.NewMessRepository(database.Database)
	financeRepo := mongo.NewFinanceRepository(database.Database)
	feedRepo := mongo.NewFeedRepository(database.Database)

	// --- Services ---
	userService := services.NewUserService(userRepo, cfg)
	messService := services.NewMessService(messRepo, userRepo)
	financeService := services.NewFinanceService(financeRepo, messRepo, userRepo)
	feedService := services.NewFeedService(feedRepo, messRepo, userRepo)

	// --- Handlers ---
	authHandler := handlers.NewAuthHandler(userService)
	messHandler := handlers.NewMessHandler(messService)
	financeHandler := handlers.NewFinanceHandler(financeService)
	feedHandler := handlers.NewFeedHandler(feedService)

	// --- Router ---
	r := router.NewRouter(cfg, authHandler, messHandler, financeHandler, feedHandler)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
