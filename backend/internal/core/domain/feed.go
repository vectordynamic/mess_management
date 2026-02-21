package domain

import (
	"context"
	"time"
)

type FeedCategory string

const (
	CategoryHouseRent FeedCategory = "house_rent"
	CategoryBuy       FeedCategory = "buy"
	CategorySell      FeedCategory = "sell"
	CategoryService   FeedCategory = "service"
	CategoryHelp      FeedCategory = "help"
)

type FeedPost struct {
	ID          string       `bson:"_id" json:"id"`
	UserID      string       `bson:"user_id" json:"user_id"`
	UserName    string       `bson:"user_name,omitempty" json:"user_name,omitempty"`
	MessID      string       `bson:"mess_id" json:"mess_id"`
	MessName    string       `bson:"mess_name,omitempty" json:"mess_name,omitempty"`
	Category    FeedCategory `bson:"category" json:"category"`
	Title       string       `bson:"title" json:"title"`
	Description string       `bson:"description" json:"description"`
	Location    Location     `bson:"location" json:"location"`
	ContactInfo string       `bson:"contact_info" json:"contact_info"`
	Price       float64      `bson:"price,omitempty" json:"price,omitempty"`
	Status      string       `bson:"status" json:"status"` // active, sold, closed
	CreatedAt   time.Time    `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time    `bson:"updated_at" json:"updated_at"`
}

type Location struct {
	City    string `bson:"city" json:"city"`
	Area    string `bson:"area" json:"area"`
	Address string `bson:"address" json:"address"`
}

type FeedRepository interface {
	Create(ctx context.Context, post *FeedPost) error
	GetByID(ctx context.Context, id string) (*FeedPost, error)
	List(ctx context.Context, filter map[string]interface{}) ([]FeedPost, error)
	Update(ctx context.Context, post *FeedPost) error
	Delete(ctx context.Context, id string) error
}
