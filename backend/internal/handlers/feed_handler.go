package handlers

import (
	"amar-dera/internal/core/domain"
	"amar-dera/internal/core/services"
	"amar-dera/pkg/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type FeedHandler struct {
	service *services.FeedService
}

func NewFeedHandler(service *services.FeedService) *FeedHandler {
	return &FeedHandler{service: service}
}

func (h *FeedHandler) CreatePost(c *gin.Context) {
	var req struct {
		Category    domain.FeedCategory `json:"category" binding:"required"`
		Title       string              `json:"title" binding:"required"`
		Description string              `json:"description" binding:"required"`
		Location    domain.Location     `json:"location" binding:"required"`
		ContactInfo string              `json:"contact_info" binding:"required"`
		Price       float64             `json:"price"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	userID := c.GetString("userID")
	messID := c.GetString("messID") // Assuming messID is in context from middleware if user is in a mess

	post := &domain.FeedPost{
		UserID:      userID,
		MessID:      messID,
		Category:    req.Category,
		Title:       req.Title,
		Description: req.Description,
		Location:    req.Location,
		ContactInfo: req.ContactInfo,
		Price:       req.Price,
	}

	createdPost, err := h.service.CreatePost(c.Request.Context(), post)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to create post", err)
		return
	}

	utils.SendSuccess(c, http.StatusCreated, "post created", createdPost)
}

func (h *FeedHandler) ListPosts(c *gin.Context) {
	category := c.Query("category")
	city := c.Query("city")
	area := c.Query("area")

	posts, err := h.service.ListPosts(c.Request.Context(), category, city, area)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to list posts", err)
		return
	}

	utils.SendSuccess(c, http.StatusOK, "feed posts", posts)
}

func (h *FeedHandler) GetPost(c *gin.Context) {
	id := c.Param("id")
	post, err := h.service.GetPost(c.Request.Context(), id)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "failed to get post", err)
		return
	}
	if post == nil {
		utils.SendError(c, http.StatusNotFound, "post not found", nil)
		return
	}

	utils.SendSuccess(c, http.StatusOK, "post details", post)
}

func (h *FeedHandler) UpdatePost(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Category    domain.FeedCategory `json:"category"`
		Title       string              `json:"title"`
		Description string              `json:"description"`
		Location    domain.Location     `json:"location"`
		ContactInfo string              `json:"contact_info"`
		Price       float64             `json:"price"`
		Status      string              `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid request", err)
		return
	}

	userID := c.GetString("userID")
	updates := &domain.FeedPost{
		Category:    req.Category,
		Title:       req.Title,
		Description: req.Description,
		Location:    req.Location,
		ContactInfo: req.ContactInfo,
		Price:       req.Price,
		Status:      req.Status,
	}

	updatedPost, err := h.service.UpdatePost(c.Request.Context(), id, userID, updates)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.SendSuccess(c, http.StatusOK, "post updated", updatedPost)
}

func (h *FeedHandler) DeletePost(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("userID")

	if err := h.service.DeletePost(c.Request.Context(), id, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.SendSuccess(c, http.StatusOK, "post deleted", nil)
}
