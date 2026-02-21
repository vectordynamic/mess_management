package services

import (
	"amar-dera/internal/core/domain"
	"amar-dera/pkg/utils"
	"context"
	"errors"
	"fmt"
	"time"
)

type MessService struct {
	repo     domain.MessRepository
	userRepo domain.UserRepository
}

func NewMessService(repo domain.MessRepository, userRepo domain.UserRepository) *MessService {
	return &MessService{repo: repo, userRepo: userRepo}
}

func (s *MessService) GetMessDetails(ctx context.Context, id string) (*domain.Mess, error) {
	mess, err := s.repo.GetByID(ctx, id)
	if err != nil || mess == nil {
		return mess, err
	}

	// Populate UserNames
	for i, m := range mess.Members {
		user, err := s.userRepo.GetByID(ctx, m.UserID)
		if err == nil && user != nil {
			mess.Members[i].Name = user.Name
		}
	}

	return mess, nil
}

func (s *MessService) GetByID(ctx context.Context, id string) (*domain.Mess, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *MessService) CreateMess(ctx context.Context, name, adminID string) (*domain.Mess, error) {
	// Check if user is already in a mess
	existingUser, _ := s.userRepo.GetByID(ctx, adminID)
	if existingUser != nil && len(existingUser.Messes) > 0 {
		return nil, errors.New("you are already a member of a mess. leave it first")
	}

	// Generate Mess ID
	id := utils.GenerateID(name, 4)

	// Create Member (Admin)
	adminUser, _ := s.userRepo.GetByID(ctx, adminID)
	adminName := ""
	if adminUser != nil {
		adminName = adminUser.Name
	}

	adminMember := domain.Member{
		UserID:   adminID,
		Name:     adminName,
		Roles:    []domain.Role{domain.RoleAdmin, domain.RoleMember},
		JoinedAt: time.Now(),
		Status:   "active",
	}

	mess := &domain.Mess{
		ID:        id,
		Name:      name,
		AdminID:   adminID,
		Members:   []domain.Member{adminMember},
		CreatedAt: time.Now(),
	}

	if err := s.repo.Create(ctx, mess); err != nil {
		return nil, err
	}

	// Update User's Mess List
	user, err := s.userRepo.GetByID(ctx, adminID)
	if err == nil && user != nil {
		user.Messes = append(user.Messes, id)
		user.CurrentMessID = id
		s.userRepo.Update(ctx, user)
	}

	return mess, nil
}

func (s *MessService) RequestJoin(ctx context.Context, messID, userID string) error {
	// Check if user is already in a mess
	existingUser, _ := s.userRepo.GetByID(ctx, userID)
	if existingUser != nil && len(existingUser.Messes) > 0 {
		return errors.New("cannot join a new mess while being a member of another")
	}

	mess, err := s.repo.GetByID(ctx, messID)
	if err != nil || mess == nil {
		fmt.Printf("[DEBUG] RequestJoin: mess not found: %s\n", messID)
		return errors.New("mess not found")
	}
	fmt.Printf("[DEBUG] RequestJoin: found mess: %s for user %s\n", mess.Name, userID)

	// Check if already a member or pending
	for _, m := range mess.Members {
		if m.UserID == userID {
			if m.Status == "pending" {
				fmt.Printf("[DEBUG] RequestJoin: user %s already has pending request for mess %s. Syncing user document.\n", userID, messID)
				// Sync user document just in case it missed it
				user, err := s.userRepo.GetByID(ctx, userID)
				if err == nil && user != nil {
					found := false
					for _, reqID := range user.JoinRequests {
						if reqID == messID {
							found = true
							break
						}
					}
					if !found {
						user.JoinRequests = append(user.JoinRequests, messID)
						s.userRepo.Update(ctx, user)
					}
				}
				return errors.New("you already gave a request, it's pending")
			}
			fmt.Printf("[DEBUG] RequestJoin: user %s is already a member of mess %s\n", userID, messID)
			return errors.New("already a member")
		}
	}

	user, _ := s.userRepo.GetByID(ctx, userID)
	userName := ""
	if user != nil {
		userName = user.Name
	}

	member := domain.Member{
		UserID:   userID,
		Name:     userName,
		Roles:    []domain.Role{domain.RoleMember},
		JoinedAt: time.Now(),
		Status:   "pending",
	}

	if err := s.repo.AddMember(ctx, messID, member); err != nil {
		fmt.Printf("[DEBUG] RequestJoin: repo.AddMember failed: %v\n", err)
		return err
	}

	// Track in User document
	user, err = s.userRepo.GetByID(ctx, userID)
	if err == nil && user != nil {
		user.JoinRequests = append(user.JoinRequests, messID)
		if err := s.userRepo.Update(ctx, user); err != nil {
			fmt.Printf("[DEBUG] RequestJoin: userRepo.Update failed: %v\n", err)
		} else {
			fmt.Printf("[DEBUG] RequestJoin: user %s document updated with join request for %s\n", userID, messID)
		}
	}

	return nil
}

func (s *MessService) ApproveMember(ctx context.Context, messID, userID, approverID string) error {
	mess, _ := s.repo.GetByID(ctx, messID)
	if mess == nil {
		return errors.New("mess not found")
	}

	// Check Approver Role
	isAdmin := false
	for _, m := range mess.Members {
		if m.UserID == approverID {
			for _, r := range m.Roles {
				if r == domain.RoleAdmin {
					isAdmin = true
					break
				}
			}
		}
	}
	if !isAdmin {
		return errors.New("only admin can approve members")
	}

	updatedMembers := []domain.Member{}
	found := false
	for _, m := range mess.Members {
		if m.UserID == userID {
			m.Status = "active"
			// Ensure name is populated if it was missing
			if m.Name == "" {
				user, _ := s.userRepo.GetByID(ctx, userID)
				if user != nil {
					m.Name = user.Name
				}
			}
			found = true
		}
		updatedMembers = append(updatedMembers, m)
	}

	if !found {
		return errors.New("member request not found")
	}

	mess.Members = updatedMembers
	if err := s.repo.Update(ctx, mess); err != nil {
		return err
	}

	// Update the target user's document
	targetUser, err := s.userRepo.GetByID(ctx, userID)
	if err == nil && targetUser != nil {
		// Remove from JoinRequests
		var newJoinRequests []string
		for _, reqID := range targetUser.JoinRequests {
			if reqID != messID {
				newJoinRequests = append(newJoinRequests, reqID)
			}
		}
		targetUser.JoinRequests = newJoinRequests

		// Add to Messes if not already there
		isAlreadyInList := false
		for _, mID := range targetUser.Messes {
			if mID == messID {
				isAlreadyInList = true
				break
			}
		}
		if !isAlreadyInList {
			targetUser.Messes = append(targetUser.Messes, messID)
		}

		// Set as current mess if none selected
		if targetUser.CurrentMessID == "" {
			targetUser.CurrentMessID = messID
		}

		return s.userRepo.Update(ctx, targetUser)
	}

	return nil
}

func (s *MessService) GetRequests(ctx context.Context, messID, userID string) ([]domain.Member, error) {
	mess, err := s.repo.GetByID(ctx, messID)
	if err != nil {
		return nil, err
	}

	// Verify Admin
	isAdmin := false
	for _, m := range mess.Members {
		if m.UserID == userID {
			for _, r := range m.Roles {
				if r == domain.RoleAdmin {
					isAdmin = true
					break
				}
			}
		}
	}
	if !isAdmin {
		return nil, errors.New("unauthorized")
	}

	requests := []domain.Member{}
	for _, m := range mess.Members {
		if m.Status == "pending" {
			requests = append(requests, m)
		}
	}
	return requests, nil
}

func (s *MessService) AssignRole(ctx context.Context, messID, targetUserID, adminID string, role domain.Role) error {
	mess, _ := s.repo.GetByID(ctx, messID)
	// Verify Admin
	isAdmin := false
	for _, m := range mess.Members {
		if m.UserID == adminID {
			for _, r := range m.Roles {
				if r == domain.RoleAdmin {
					isAdmin = true
					break
				}
			}
		}
	}
	if !isAdmin {
		return errors.New("unauthorized")
	}

	// Update Role
	found := false
	updatedMembers := []domain.Member{}
	for _, m := range mess.Members {
		if m.UserID == targetUserID {
			// Check if role exists
			roleExists := false
			for _, r := range m.Roles {
				if r == role {
					roleExists = true
					break
				}
			}
			if !roleExists {
				m.Roles = append(m.Roles, role)
			}
			found = true
		}
		updatedMembers = append(updatedMembers, m)
	}

	if !found {
		return errors.New("member not found")
	}

	mess.Members = updatedMembers
	return s.repo.Update(ctx, mess)
}

func (s *MessService) RemoveRole(ctx context.Context, messID, targetUserID, adminID string, role domain.Role) error {
	mess, _ := s.repo.GetByID(ctx, messID)
	// Verify Admin
	isAdmin := false
	for _, m := range mess.Members {
		if m.UserID == adminID {
			for _, r := range m.Roles {
				if r == domain.RoleAdmin {
					isAdmin = true
					break
				}
			}
		}
	}
	if !isAdmin {
		return errors.New("unauthorized")
	}

	// Update Role
	found := false
	updatedMembers := []domain.Member{}
	for _, m := range mess.Members {
		if m.UserID == targetUserID {
			var newRoles []domain.Role
			for _, r := range m.Roles {
				if r != role {
					newRoles = append(newRoles, r)
				}
			}
			m.Roles = newRoles
			found = true
		}
		updatedMembers = append(updatedMembers, m)
	}

	if !found {
		return errors.New("member not found")
	}

	mess.Members = updatedMembers
	return s.repo.Update(ctx, mess)
}
