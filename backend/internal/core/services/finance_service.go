package services

import (
	"amar-dera/internal/core/domain"
	"amar-dera/pkg/utils"
	"context"
	"errors"
	"time"
)

type FinanceService struct {
	repo     domain.FinanceRepository
	messRepo domain.MessRepository
	userRepo domain.UserRepository
}

func NewFinanceService(repo domain.FinanceRepository, messRepo domain.MessRepository, userRepo domain.UserRepository) *FinanceService {
	return &FinanceService{repo: repo, messRepo: messRepo, userRepo: userRepo}
}

func (s *FinanceService) AddServiceCost(ctx context.Context, cost domain.ServiceCost, userID string) error {
	// Check if user is manager or admin
	if !s.isManager(ctx, cost.MessID, userID) {
		return errors.New("only manager or admin can add service costs")
	}

	if cost.ID == "" {
		cost.ID = utils.GenerateID("COST", 4)
	}
	cost.CreatedBy = userID
	cost.Status = "approved"

	// Validate Shares if present
	if len(cost.Shares) > 0 {
		totalShares := 0.0
		for _, s := range cost.Shares {
			totalShares += s.Amount
		}
		// Allow small float tolerance if needed, but for currency exact match is preferred usually.
		// Let's use a small epsilon for float comparison.
		diff := cost.Amount - totalShares
		if diff < -0.1 || diff > 0.1 {
			return errors.New("sum of shares must equal total amount")
		}
	}

	// TODO: Check Month Lock
	return s.repo.AddServiceCost(ctx, &cost)
}

func (s *FinanceService) GetServiceCosts(ctx context.Context, messID, month string) ([]domain.ServiceCost, error) {
	return s.repo.GetServiceCosts(ctx, messID, month)
}

func (s *FinanceService) DeleteServiceCost(ctx context.Context, costID string) error {
	// TODO: Check Month Lock
	return s.repo.DeleteServiceCost(ctx, costID)
}

func (s *FinanceService) SubmitPayment(ctx context.Context, payment domain.Payment, submitterID string) error {
	// Check if submitter is manager or admin
	if !s.isManager(ctx, payment.MessID, submitterID) {
		return errors.New("only manager or admin can record payments")
	}

	if payment.ID == "" {
		payment.ID = utils.GenerateID("PAY", 4)
	}

	// Ensure UserID is set (if manager didn't provide it, default to submitter? Or error? Frontend provides it.)
	if payment.UserID == "" {
		payment.UserID = submitterID
	}

	payment.Status = "approved"
	payment.CreatedAt = time.Now()
	// TODO: Check Month Lock
	return s.repo.CreatePayment(ctx, &payment)
}

func (s *FinanceService) VerifyPayment(ctx context.Context, paymentID, approverID string) error {
	// 1. Get payment to find messID
	payment, err := s.repo.GetPaymentByID(ctx, paymentID)
	if err != nil || payment == nil {
		return errors.New("payment not found")
	}

	// 2. Check if approver is manager
	if !s.isManager(ctx, payment.MessID, approverID) {
		return errors.New("only manager can verify payments")
	}

	return s.repo.UpdatePaymentStatus(ctx, paymentID, "approved", approverID)
}

func (s *FinanceService) GetPendingPayments(ctx context.Context, messID, month string) ([]domain.Payment, error) {
	payments, err := s.repo.GetPayments(ctx, messID, month)
	if err != nil {
		return nil, err
	}
	pending := []domain.Payment{}
	for _, p := range payments {
		if p.Status == "pending" {
			pending = append(pending, p)
		}
	}
	return pending, nil
}

func (s *FinanceService) GetMemberPayments(ctx context.Context, messID, userID string) ([]domain.Payment, error) {
	return s.repo.GetMemberPayments(ctx, messID, userID)
}

func (s *FinanceService) UpsertDailyMeal(ctx context.Context, meal domain.DailyMeal) error {
	// TODO: Check Month Lock
	return s.repo.UpsertDailyMeal(ctx, &meal)
}

func (s *FinanceService) GetDailyMeals(ctx context.Context, messID, month string) ([]domain.DailyMeal, error) {
	return s.repo.GetDailyMeals(ctx, messID, month)
}

func (s *FinanceService) BatchUpdateMeals(ctx context.Context, meals []domain.DailyMeal, userID string) error {
	if len(meals) == 0 {
		return nil
	}

	// Check if user is manager for the mess
	if !s.isManager(ctx, meals[0].MessID, userID) {
		return errors.New("only manager can update meals")
	}

	for _, meal := range meals {
		if err := s.repo.UpsertDailyMeal(ctx, &meal); err != nil {
			return err
		}
	}
	return nil
}

func (s *FinanceService) CreateBazar(ctx context.Context, bazar domain.Bazar) error {
	// Check if user is manager or admin
	if !s.isManager(ctx, bazar.MessID, bazar.BuyerID) {
		return errors.New("only manager or admin can add bazar entries")
	}

	if bazar.ID == "" {
		bazar.ID = utils.GenerateID("BAZAR", 4)
	}
	bazar.Status = "approved"
	if bazar.Date.IsZero() {
		bazar.Date = time.Now()
	}

	// TODO: Check Month Lock
	return s.repo.CreateBazar(ctx, &bazar)
}

func (s *FinanceService) GetPendingBazars(ctx context.Context, messID, month string) ([]domain.Bazar, error) {
	bazars, err := s.repo.GetBazars(ctx, messID, month)
	if err != nil {
		return nil, err
	}
	pending := []domain.Bazar{}
	for _, b := range bazars {
		if b.Status == "pending" {
			pending = append(pending, b)
		}
	}
	return pending, nil
}

func (s *FinanceService) ApproveBazar(ctx context.Context, bazarID, approverID string) error {
	// 1. Get bazar to find messID
	bazar, err := s.repo.GetBazarByID(ctx, bazarID)
	if err != nil || bazar == nil {
		return errors.New("bazar entry not found")
	}

	// 2. Check if approver is manager
	if !s.isManager(ctx, bazar.MessID, approverID) {
		return errors.New("only manager can approve bazar entries")
	}

	return s.repo.ApproveBazar(ctx, bazarID)
}

func (s *FinanceService) UpdateBazar(ctx context.Context, bazar domain.Bazar, userID string) error {
	existing, err := s.repo.GetBazarByID(ctx, bazar.ID)
	if err != nil || existing == nil {
		return errors.New("bazar entry not found")
	}

	// Permission: Manager or Owner (if pending/approved? User said Manager mainly)
	// Let's allow Manager OR Owner
	isManager := s.isManager(ctx, existing.MessID, userID)
	if existing.BuyerID != userID && !isManager {
		return errors.New("unauthorized to update this bazar entry")
	}

	// Preserve immutable fields
	bazar.MessID = existing.MessID
	// If user is manager, they might be changing the BuyerID, so we keep input BuyerID if provided, else keep existing
	if bazar.BuyerID == "" {
		bazar.BuyerID = existing.BuyerID
	}

	// If simplistic update, just update amount/items
	existing.Amount = bazar.Amount
	existing.Items = bazar.Items
	existing.BuyerID = bazar.BuyerID // Allow updating buyer
	// existing.Date = bazar.Date // Date update is tricky if not passed correctly

	return s.repo.UpdateBazar(ctx, existing)
}

func (s *FinanceService) DeleteBazar(ctx context.Context, bazarID, userID string) error {
	existing, err := s.repo.GetBazarByID(ctx, bazarID)
	if err != nil || existing == nil {
		return errors.New("bazar entry not found")
	}

	isManager := s.isManager(ctx, existing.MessID, userID)
	if existing.BuyerID != userID && !isManager {
		return errors.New("unauthorized to delete this bazar entry")
	}

	return s.repo.DeleteBazar(ctx, bazarID)
}

func (s *FinanceService) GetBazars(ctx context.Context, messID, month string) ([]domain.Bazar, error) {
	return s.repo.GetBazars(ctx, messID, month)
}

// --- History / Month Lock ---

func (s *FinanceService) RequestUnlock(ctx context.Context, messID, month string) error {
	lock, err := s.repo.GetMonthLock(ctx, messID, month)
	if err != nil {
		return err
	}
	if lock == nil {
		lock = &domain.MonthLock{
			MessID:   messID,
			Month:    month,
			IsLocked: true, // Default to locked if created late
		}
	}
	lock.UnlockRequested = true
	return s.repo.UpsertMonthLock(ctx, lock)
}

func (s *FinanceService) GetLockStatus(ctx context.Context, messID, month string) (*domain.MonthLock, error) {
	return s.repo.GetMonthLock(ctx, messID, month)
}

func (s *FinanceService) SetLockStatus(ctx context.Context, messID, month string, isLocked bool, expiryDuration time.Duration) error {
	lock, err := s.repo.GetMonthLock(ctx, messID, month)
	if err != nil {
		return err
	}
	if lock == nil {
		lock = &domain.MonthLock{
			MessID: messID,
			Month:  month,
		}
	}
	lock.IsLocked = isLocked
	lock.UnlockRequested = false // Reset request
	if !isLocked && expiryDuration > 0 {
		lock.UnlockExpiry = time.Now().Add(expiryDuration)
	}
	return s.repo.UpsertMonthLock(ctx, lock)
}

// --- Summary Calculation Logic ---

type MemberSummary struct {
	UserID       string  `json:"user_id"`
	Name         string  `json:"name"`
	TotalMeals   float64 `json:"total_meals"`
	MealCost     float64 `json:"meal_cost"`
	ServiceShare float64 `json:"service_share"`
	BazarSpent   float64 `json:"bazar_spent"`   // Credit (Meals)
	HousePaid    float64 `json:"house_paid"`    // Credit (House)
	MealPaid     float64 `json:"meal_paid"`     // Credit (Meals)
	TotalPaid    float64 `json:"total_paid"`    // Total Cash Payments
	TotalDebit   float64 `json:"total_debit"`   // ServiceShare + MealCost
	TotalCredit  float64 `json:"total_credit"`  // BazarSpent + HousePaid + MealPaid
	HouseBalance float64 `json:"house_balance"` // HousePaid - ServiceShare
	MealBalance  float64 `json:"meal_balance"`  // BazarSpent + MealPaid - MealCost
	Balance      float64 `json:"balance"`       // TotalCredit - TotalDebit
}

type MonthSummary struct {
	Month            string                   `json:"month"`
	TotalServiceCost float64                  `json:"total_service_cost"`
	TotalMealCost    float64                  `json:"total_meal_cost"`
	MealRate         float64                  `json:"meal_rate"`
	TotalMeals       float64                  `json:"total_meals"`
	MemberSummaries  map[string]MemberSummary `json:"member_summaries"`
}

func (s *FinanceService) GenerateMonthlySummary(ctx context.Context, messID, month string) (*MonthSummary, error) {
	// 1. Get Mess for member details (Rent)
	mess, _ := s.messRepo.GetByID(ctx, messID)
	if mess == nil {
		return nil, errors.New("mess not found")
	}

	// 2. Fetch Service Costs (Shared)
	serviceCosts, _ := s.repo.GetServiceCosts(ctx, messID, month)
	totalService := 0.0
	for _, c := range serviceCosts {
		if c.Status == "approved" {
			totalService += c.Amount
		}
	}

	// 3. Fetch Meals
	meals, _ := s.repo.GetDailyMeals(ctx, messID, month)
	totalMeals := 0.0
	userMeals := make(map[string]float64)
	for _, m := range meals {
		dailyTotal := m.Breakfast + m.Lunch + m.Dinner + float64(m.GuestMeals)
		userMeals[m.UserID] += dailyTotal
		totalMeals += dailyTotal
	}

	// 4. Fetch Bazars (Approved Only)
	bazars, _ := s.repo.GetBazars(ctx, messID, month)
	totalBazar := 0.0
	userBazarSpent := make(map[string]float64)
	for _, b := range bazars {
		if b.Status == "approved" {
			totalBazar += b.Amount
			userBazarSpent[b.BuyerID] += b.Amount
		}
	}

	// 5. Fetch Payments (Approved Only)
	payments, _ := s.repo.GetPayments(ctx, messID, month)
	userTotalPaid := make(map[string]float64)
	userHousePaid := make(map[string]float64)
	userMealPaid := make(map[string]float64)
	for _, p := range payments {
		if p.Status == "approved" {
			userTotalPaid[p.UserID] += p.Amount
			if p.Type == domain.PaymentTypeHouse {
				userHousePaid[p.UserID] += p.Amount
			} else {
				userMealPaid[p.UserID] += p.Amount
			}
		}
	}

	// 6. Calculations
	mealRate := 0.0
	if totalMeals > 0 {
		mealRate = totalBazar / totalMeals
	}

	activeMemberCount := 0.0
	for _, m := range mess.Members {
		if m.Status == "active" {
			activeMemberCount++
		}
	}
	if activeMemberCount == 0 {
		activeMemberCount = 1
	}

	// Calculate Per-Person Service Cost (Old way: totalService / activeCount)
	// New way: We need to calculate how much EACH user owes for service costs.
	// Since costs can now be split unequally, we can't use a single "perPersonService" rate for everyone consistently if there are custom splits.
	// We will calculate a map of UserID -> ServiceDebt
	userServiceDebt := make(map[string]float64)

	for _, cost := range serviceCosts {
		if cost.Status != "approved" {
			continue
		}

		if len(cost.Shares) > 0 {
			// Custom Split
			for _, share := range cost.Shares {
				userServiceDebt[share.UserID] += share.Amount
			}
		} else {
			// Equal Split (Default)
			splitAmount := cost.Amount / activeMemberCount
			for _, m := range mess.Members {
				if m.Status == "active" {
					userServiceDebt[m.UserID] += splitAmount
				}
			}
		}
	}

	// perPersonService is now variable per user, so we remove the single variable definition
	// and use the map lookup inside the loop.

	summaries := make(map[string]MemberSummary)
	for _, m := range mess.Members {
		if m.Status != "active" {
			continue
		}

		mealsCount := userMeals[m.UserID]
		mealCost := mealsCount * mealRate
		bazarSpent := userBazarSpent[m.UserID]
		totalPaid := userTotalPaid[m.UserID]
		housePaid := userHousePaid[m.UserID]
		mealPaid := userMealPaid[m.UserID]

		// Use calculated service debt for this user
		individualServiceCost := userServiceDebt[m.UserID]

		// Refactored: No individual fixed rent. All house costs are shared.
		totalDebit := individualServiceCost + mealCost
		// Credit is ONLY what they paid (Cash). Bazar expenses are from the fund, not personal credit here.
		totalCredit := housePaid + mealPaid
		balance := totalCredit - totalDebit

		houseBalance := housePaid - individualServiceCost
		mealBalance := mealPaid - mealCost

		userName := m.Name
		if userName == "" {
			user, _ := s.userRepo.GetByID(ctx, m.UserID)
			if user != nil {
				userName = user.Name
			} else {
				userName = "Unknown"
			}
		}

		summaries[m.UserID] = MemberSummary{
			UserID:       m.UserID,
			Name:         userName,
			TotalMeals:   mealsCount,
			MealCost:     mealCost,
			ServiceShare: individualServiceCost, // Variable now
			BazarSpent:   bazarSpent,
			HousePaid:    housePaid,
			MealPaid:     mealPaid,
			TotalPaid:    totalPaid,
			TotalDebit:   totalDebit,
			TotalCredit:  totalCredit,
			HouseBalance: houseBalance,
			MealBalance:  mealBalance,
			Balance:      balance,
		}
	}

	return &MonthSummary{
		Month:            month,
		TotalServiceCost: totalService,
		TotalMealCost:    totalBazar,
		MealRate:         mealRate,
		TotalMeals:       totalMeals,
		MemberSummaries:  summaries,
	}, nil
}

func (s *FinanceService) isManager(ctx context.Context, messID, userID string) bool {
	mess, err := s.messRepo.GetByID(ctx, messID)
	if err != nil || mess == nil {
		return false
	}
	for _, m := range mess.Members {
		if m.UserID == userID {
			for _, r := range m.Roles {
				if r == domain.RoleManager {
					return true
				}
			}
		}
	}
	return false
}
