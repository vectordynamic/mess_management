package services

import (
	"amar-dera/internal/core/domain"
	"amar-dera/pkg/utils"
	"context"
	"errors"
	"time"
)

type FeedService struct {
	repo     domain.FeedRepository
	messRepo domain.MessRepository
	userRepo domain.UserRepository
}

func NewFeedService(repo domain.FeedRepository, messRepo domain.MessRepository, userRepo domain.UserRepository) *FeedService {
	return &FeedService{
		repo:     repo,
		messRepo: messRepo,
		userRepo: userRepo,
	}
}

func (s *FeedService) CreatePost(ctx context.Context, post *domain.FeedPost) (*domain.FeedPost, error) {
	// Populate User and Mess details
	user, err := s.userRepo.GetByID(ctx, post.UserID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	post.UserName = user.Name

	// If messID is not provided (from handler/request), use user's current mess
	if post.MessID == "" {
		post.MessID = user.CurrentMessID
	}

	if post.MessID != "" {
		mess, err := s.messRepo.GetByID(ctx, post.MessID)
		if err == nil && mess != nil {
			post.MessName = mess.Name
		}
	}

	post.ID = utils.GenerateID("POST", 8)
	post.Status = "active"
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()

	if err := s.repo.Create(ctx, post); err != nil {
		return nil, err
	}

	return post, nil
}

func (s *FeedService) ListPosts(ctx context.Context, category, city, area string) ([]domain.FeedPost, error) {
	filter := make(map[string]interface{})
	if category != "" {
		filter["category"] = category
	}
	if city != "" {
		filter["location.city"] = city
	}
	if area != "" {
		filter["location.area"] = area
	}
	filter["status"] = "active"

	return s.repo.List(ctx, filter)
}

func (s *FeedService) GetPost(ctx context.Context, id string) (*domain.FeedPost, error) {
	return s.repo.GetByID(ctx, id)
}
