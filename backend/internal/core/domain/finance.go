package domain

import (
	"context"
	"time"
)

// --- Service Costs (Fixed) ---
type CostShare struct {
	UserID string  `bson:"user_id" json:"user_id"`
	Amount float64 `bson:"amount" json:"amount"`
}

type ServiceCost struct {
	ID        string      `bson:"_id" json:"id"`
	MessID    string      `bson:"mess_id" json:"mess_id"`
	Month     string      `bson:"month" json:"month"` // YYYY-MM
	Name      string      `bson:"name" json:"name"`   // Gas, WiFi, etc.
	Amount    float64     `bson:"amount" json:"amount"`
	Shares    []CostShare `bson:"shares,omitempty" json:"shares,omitempty"` // Optional: Custom split
	CreatedBy string      `bson:"created_by" json:"created_by"`
	Status    string      `bson:"status" json:"status"` // pending, approved
}

// --- Payments (Cash In) ---
type PaymentType string

const (
	PaymentTypeHouse PaymentType = "house" // Rent + Bills
	PaymentTypeMeal  PaymentType = "meal"  // Bazar + Meal
)

type Payment struct {
	ID         string      `bson:"_id" json:"id"`
	UserID     string      `bson:"user_id" json:"user_id"`
	MessID     string      `bson:"mess_id" json:"mess_id"`
	Amount     float64     `bson:"amount" json:"amount"`
	Type       PaymentType `bson:"type" json:"type"`
	Status     string      `bson:"status" json:"status"` // pending, approved, rejected
	Month      string      `bson:"month" json:"month"`
	CreatedAt  time.Time   `bson:"created_at" json:"created_at"`
	ApprovedBy string      `bson:"approved_by,omitempty" json:"approved_by,omitempty"`
}

// --- Bazar (Shopping) ---
type Bazar struct {
	ID      string    `bson:"_id" json:"id"`
	MessID  string    `bson:"mess_id" json:"mess_id"`
	BuyerID string    `bson:"buyer_id" json:"buyer_id"`
	Amount  float64   `bson:"amount" json:"amount"`
	Items   string    `bson:"items" json:"items"`
	Date    time.Time `bson:"date" json:"date"`
	Status  string    `bson:"status" json:"status"` // pending, approved
	Month   string    `bson:"month" json:"month"`
}

// --- Daily Meals ---
type DailyMeal struct {
	ID         string    `bson:"_id,omitempty" json:"id"`
	MessID     string    `bson:"mess_id" json:"mess_id"`
	UserID     string    `bson:"user_id" json:"user_id"`
	Date       time.Time `bson:"date" json:"date"`
	Breakfast  float64   `bson:"breakfast" json:"breakfast"` // 1, 0.5, 0
	Lunch      float64   `bson:"lunch" json:"lunch"`
	Dinner     float64   `bson:"dinner" json:"dinner"`
	GuestMeals int       `bson:"guest_meals" json:"guest_meals"`
	Month      string    `bson:"month" json:"month"`
}

// --- Month Lock ---
type MonthLock struct {
	ID              string    `bson:"_id" json:"id"`
	MessID          string    `bson:"mess_id" json:"mess_id"`
	Month           string    `bson:"month" json:"month"`
	IsLocked        bool      `bson:"is_locked" json:"is_locked"`
	UnlockRequested bool      `bson:"unlock_requested" json:"unlock_requested"`
	UnlockExpiry    time.Time `bson:"unlock_expiry,omitempty" json:"unlock_expiry,omitempty"`
}

type FinanceRepository interface {
	// Service Costs
	AddServiceCost(ctx context.Context, cost *ServiceCost) error
	GetServiceCosts(ctx context.Context, messID, month string) ([]ServiceCost, error)
	DeleteServiceCost(ctx context.Context, costID string) error

	// Payments
	CreatePayment(ctx context.Context, payment *Payment) error
	GetPaymentByID(ctx context.Context, paymentID string) (*Payment, error)
	GetPayments(ctx context.Context, messID, month string) ([]Payment, error)
	GetMemberPayments(ctx context.Context, messID, userID string) ([]Payment, error)
	UpdatePaymentStatus(ctx context.Context, paymentID, status, approverID string) error

	// Bazar
	CreateBazar(ctx context.Context, bazar *Bazar) error
	GetBazarByID(ctx context.Context, bazarID string) (*Bazar, error)
	GetBazars(ctx context.Context, messID, month string) ([]Bazar, error)
	ApproveBazar(ctx context.Context, bazarID string) error
	UpdateBazar(ctx context.Context, bazar *Bazar) error
	DeleteBazar(ctx context.Context, bazarID string) error

	// Meals
	UpsertDailyMeal(ctx context.Context, meal *DailyMeal) error
	GetDailyMeals(ctx context.Context, messID, month string) ([]DailyMeal, error)

	// Lock
	GetMonthLock(ctx context.Context, messID, month string) (*MonthLock, error)
	UpsertMonthLock(ctx context.Context, lock *MonthLock) error
}
