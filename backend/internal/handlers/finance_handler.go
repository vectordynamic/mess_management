package handlers

import (
	"amar-dera/internal/core/domain"
	"amar-dera/internal/core/services"
	"amar-dera/pkg/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type FinanceHandler struct {
	service *services.FinanceService
}

func NewFinanceHandler(service *services.FinanceService) *FinanceHandler {
	return &FinanceHandler{service: service}
}

func (h *FinanceHandler) AddServiceCost(c *gin.Context) {
	var req domain.ServiceCost
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	userID := c.GetString("userID")
	if err := h.service.AddServiceCost(c.Request.Context(), req, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to add cost", err)
		return
	}
	utils.SendSuccess(c, http.StatusCreated, "cost added", nil)
}

func (h *FinanceHandler) GetServiceCosts(c *gin.Context) {
	messID := c.Param("id")
	month := c.Query("month")
	if month == "" {
		utils.SendError(c, http.StatusBadRequest, "month required", nil)
		return
	}

	costs, err := h.service.GetServiceCosts(c.Request.Context(), messID, month)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to fetch costs", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "service costs", costs)
}

func (h *FinanceHandler) DeleteServiceCost(c *gin.Context) {
	costID := c.Param("costId")
	if err := h.service.DeleteServiceCost(c.Request.Context(), costID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to delete cost", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "cost deleted", nil)
}

func (h *FinanceHandler) GetMonthSummary(c *gin.Context) {
	messID := c.Param("id")
	month := c.Query("month") // YYYY-MM

	if month == "" {
		utils.SendError(c, http.StatusBadRequest, "month required", nil)
		return
	}

	summary, err := h.service.GenerateMonthlySummary(c.Request.Context(), messID, month)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to generate summary", err)
		return
	}

	utils.SendSuccess(c, http.StatusOK, "monthly summary", summary)
}

func (h *FinanceHandler) GetDailyMeals(c *gin.Context) {
	messID := c.Param("id")
	month := c.Query("month")
	if month == "" {
		utils.SendError(c, http.StatusBadRequest, "month required", nil)
		return
	}

	meals, err := h.service.GetDailyMeals(c.Request.Context(), messID, month)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to fetch meals", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "daily meals", meals)
}

func (h *FinanceHandler) BatchUpdateMeals(c *gin.Context) {
	var req []domain.DailyMeal
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	userID := c.GetString("userID")
	if err := h.service.BatchUpdateMeals(c.Request.Context(), req, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to update meals", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "meals updated", nil)
}

func (h *FinanceHandler) CreateBazar(c *gin.Context) {
	var req domain.Bazar
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	userID := c.GetString("userID")
	req.BuyerID = userID // Always set BuyerID to recorder as per user request (it's not about credit)
	if err := h.service.CreateBazar(c.Request.Context(), req, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to create bazar entry", err)
		return
	}
	utils.SendSuccess(c, http.StatusCreated, "bazar entry created", nil)
}

func (h *FinanceHandler) GetPendingBazars(c *gin.Context) {
	messID := c.Param("id")
	month := c.Query("month")
	if month == "" {
		utils.SendError(c, http.StatusBadRequest, "month required", nil)
		return
	}

	bazars, err := h.service.GetPendingBazars(c.Request.Context(), messID, month)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to fetch bazars", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "pending bazars", bazars)
}

func (h *FinanceHandler) GetBazars(c *gin.Context) {
	messID := c.Param("id")
	month := c.Query("month")
	if month == "" {
		utils.SendError(c, http.StatusBadRequest, "month required", nil)
		return
	}

	bazars, err := h.service.GetBazars(c.Request.Context(), messID, month)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to fetch bazars", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "bazar entries", bazars)
}

func (h *FinanceHandler) ApproveBazar(c *gin.Context) {
	bazarID := c.Param("bazarId")
	userID := c.GetString("userID")
	if err := h.service.ApproveBazar(c.Request.Context(), bazarID, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to approve bazar", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "bazar approved", nil)
}

func (h *FinanceHandler) UpdateBazar(c *gin.Context) {
	bazarID := c.Param("bazarId")
	var req domain.Bazar
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid request", err)
		return
	}
	req.ID = bazarID

	userID := c.GetString("userID")
	if err := h.service.UpdateBazar(c.Request.Context(), req, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to update bazar", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "bazar updated", nil)
}

func (h *FinanceHandler) DeleteBazar(c *gin.Context) {
	bazarID := c.Param("bazarId")
	userID := c.GetString("userID")

	if err := h.service.DeleteBazar(c.Request.Context(), bazarID, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to delete bazar", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "bazar deleted", nil)
}

func (h *FinanceHandler) GetMessPayments(c *gin.Context) {
	messID := c.Param("id")
	month := c.Query("month")
	if month == "" {
		utils.SendError(c, http.StatusBadRequest, "month required", nil)
		return
	}

	payments, err := h.service.GetMessPayments(c.Request.Context(), messID, month)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to fetch payments", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "mess payments", payments)
}

func (h *FinanceHandler) SubmitPayment(c *gin.Context) {
	var req domain.Payment
	// Debug: Log the raw body? No, Bind consumes it. Let's just log the result.
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	userID := c.GetString("userID")
	// req.UserID is already bound from JSON (the Payer). userID is the Submitter.
	if err := h.service.SubmitPayment(c.Request.Context(), req, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to submit payment", err)
		return
	}
	utils.SendSuccess(c, http.StatusCreated, "payment submitted", nil)
}

func (h *FinanceHandler) GetPendingPayments(c *gin.Context) {
	messID := c.Param("id")
	month := c.Query("month")
	if month == "" {
		utils.SendError(c, http.StatusBadRequest, "month required", nil)
		return
	}

	payments, err := h.service.GetPendingPayments(c.Request.Context(), messID, month)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to fetch payments", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "pending payments", payments)
}

func (h *FinanceHandler) GetMemberPayments(c *gin.Context) {
	messID := c.Param("id")
	userID := c.GetString("userID") // Get logged-in user ID

	payments, err := h.service.GetMemberPayments(c.Request.Context(), messID, userID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to fetch member payments", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "member payments", payments)
}

func (h *FinanceHandler) VerifyPayment(c *gin.Context) {
	paymentID := c.Param("payId")
	userID := c.GetString("userID")
	if err := h.service.VerifyPayment(c.Request.Context(), paymentID, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to verify payment", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "payment verified", nil)
}

// --- History ---

func (h *FinanceHandler) RequestUnlock(c *gin.Context) {
	messID := c.Param("id")
	month := c.Query("month")
	if month == "" {
		utils.SendError(c, http.StatusBadRequest, "month required", nil)
		return
	}

	if err := h.service.RequestUnlock(c.Request.Context(), messID, month); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to request unlock", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "unlock requested", nil)
}

func (h *FinanceHandler) GetLockStatus(c *gin.Context) {
	messID := c.Param("id")
	month := c.Query("month")
	if month == "" {
		utils.SendError(c, http.StatusBadRequest, "month required", nil)
		return
	}

	lock, err := h.service.GetLockStatus(c.Request.Context(), messID, month)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to fetch lock status", err)
		return
	}
	if lock == nil {
		utils.SendSuccess(c, http.StatusOK, "no lock record found", nil)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "lock status", lock)
}

func (h *FinanceHandler) SetLockStatus(c *gin.Context) {
	messID := c.Param("id")
	var req struct {
		Month    string `json:"month" binding:"required"`
		IsLocked bool   `json:"is_locked"`
		Duration int    `json:"duration_hours"` // Optional
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	// Verify Admin (Ideally middleware or service check, but here checking role via Context if needed, or rely on route protection)
	// For MVP assuming route is protected for Admin.

	duration := time.Duration(req.Duration) * time.Hour
	if err := h.service.SetLockStatus(c.Request.Context(), messID, req.Month, req.IsLocked, duration); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to set lock status", err)
		return
	}
	utils.SendSuccess(c, http.StatusOK, "lock status updated", nil)
}
