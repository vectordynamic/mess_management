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
	if category != "" && category != "all" && category != "undefined" {
		filter["category"] = category
	}
	if city != "" {
		filter["location.city"] = city
	}
	if area != "" {
		filter["location.area"] = area
	}

	// Only filter by active status
	filter["status"] = "active"

	return s.repo.List(ctx, filter)
}

func (s *FeedService) GetPost(ctx context.Context, id string) (*domain.FeedPost, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *FeedService) UpdatePost(ctx context.Context, postID, userID string, updates *domain.FeedPost) (*domain.FeedPost, error) {
	existing, err := s.repo.GetByID(ctx, postID)
	if err != nil || existing == nil {
		return nil, errors.New("post not found")
	}

	// Ownership check
	if existing.UserID != userID {
		return nil, errors.New("unauthorized: you can only update your own posts")
	}

	// Update fields selectively
	if updates.Category != "" {
		existing.Category = updates.Category
	}
	if updates.Title != "" {
		existing.Title = updates.Title
	}
	if updates.Description != "" {
		existing.Description = updates.Description
	}
	if updates.Location.City != "" {
		existing.Location.City = updates.Location.City
	}
	if updates.Location.Area != "" {
		existing.Location.Area = updates.Location.Area
	}
	if updates.Location.Address != "" {
		existing.Location.Address = updates.Location.Address
	}
	if updates.ContactInfo != "" {
		existing.ContactInfo = updates.ContactInfo
	}
	if updates.Price > 0 {
		existing.Price = updates.Price
	}
	if updates.Status != "" {
		existing.Status = updates.Status
	}
	existing.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	return existing, nil
}

func (s *FeedService) DeletePost(ctx context.Context, postID, userID string) error {
	existing, err := s.repo.GetByID(ctx, postID)
	if err != nil || existing == nil {
		return errors.New("post not found")
	}

	// Ownership check
	if existing.UserID != userID {
		return errors.New("unauthorized: you can only delete your own posts")
	}

	return s.repo.Delete(ctx, postID)
}
