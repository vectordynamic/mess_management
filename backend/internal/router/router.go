package router

import (
	"amar-dera/config"
	"amar-dera/internal/handlers"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	cfg *config.Config,
	authHandler *handlers.AuthHandler,
	messHandler *handlers.MessHandler,
	financeHandler *handlers.FinanceHandler,
	feedHandler *handlers.FeedHandler,
) *gin.Engine {
	r := gin.Default()

	// CORS Middleware
	r.Use(CORSMiddleware())

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	api := r.Group("/api/v1")
	{
		// Auth Routes (Public)
		auth := api.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
		}

		// Protected Routes
		protected := api.Group("/")
		protected.Use(AuthMiddleware(cfg))
		{
			// User
			protected.GET("/users/me", authHandler.Me)

			// Mess
			messGroup := protected.Group("/mess")
			{
				messGroup.POST("/create", messHandler.CreateMess)
				messGroup.POST("/join", messHandler.JoinMess)
				messGroup.GET("/:id/requests", messHandler.GetRequests)
				messGroup.GET("/:id/details", messHandler.GetMessDetails)
				messGroup.PATCH("/:id/requests/approve", messHandler.ApproveMember)
				messGroup.PATCH("/:id/roles", messHandler.AssignRole)
				messGroup.DELETE("/:id/roles", messHandler.RemoveRole)
				messGroup.POST("/:id/leave", messHandler.LeaveMess)
			}

			// Finance - House
			houseGroup := protected.Group("/house")
			{
				houseGroup.GET("/:id/costs", financeHandler.GetServiceCosts)
				houseGroup.POST("/:id/costs", financeHandler.AddServiceCost)
				houseGroup.DELETE("/:id/costs/:costId", financeHandler.DeleteServiceCost)
			}

			// Meals
			mealGroup := protected.Group("/meals")
			{
				mealGroup.GET("/:id/daily", financeHandler.GetDailyMeals)
				mealGroup.POST("/:id/update", financeHandler.BatchUpdateMeals)
			}

			// Bazar
			bazarGroup := protected.Group("/bazar")
			{
				bazarGroup.POST("/:id/entry", financeHandler.CreateBazar)
				bazarGroup.GET("/:id/pending", financeHandler.GetPendingBazars)
				bazarGroup.GET("/:id/entries", financeHandler.GetBazars)
				bazarGroup.PATCH("/:id/approve/:bazarId", financeHandler.ApproveBazar)
				bazarGroup.PATCH("/:id/entry/:bazarId", financeHandler.UpdateBazar)
				bazarGroup.DELETE("/:id/entry/:bazarId", financeHandler.DeleteBazar)
			}

			// Payments
			payGroup := protected.Group("/payments")
			{
				payGroup.POST("/:id/submit", financeHandler.SubmitPayment)
				payGroup.GET("/:id/pending", financeHandler.GetPendingPayments)
				payGroup.GET("/:id/my-history", financeHandler.GetMemberPayments)
				payGroup.GET("/:id/all-history", financeHandler.GetMessPayments)
				payGroup.PATCH("/:id/verify/:payId", financeHandler.VerifyPayment)
			}

			// Summary
			summaryGroup := protected.Group("/summary")
			{
				summaryGroup.GET("/:id/fixed", financeHandler.GetMonthSummary)
				summaryGroup.GET("/:id/meals", financeHandler.GetMonthSummary)
				summaryGroup.GET("/:id/final", financeHandler.GetMonthSummary)
			}

			// History
			histGroup := protected.Group("/history")
			{
				histGroup.POST("/:id/unlock-request", financeHandler.RequestUnlock)
				histGroup.GET("/:id/pending-requests", financeHandler.GetLockStatus)
				histGroup.PATCH("/:id/lock-status", financeHandler.SetLockStatus)
			}

			// Feed
			feed := protected.Group("/feed")
			{
				feed.POST("", feedHandler.CreatePost)
				feed.GET("", feedHandler.ListPosts)
				feed.GET("/:id", feedHandler.GetPost)
				feed.PATCH("/:id", feedHandler.UpdatePost)
				feed.DELETE("/:id", feedHandler.DeletePost)
			}
		}
	}

	return r
}
