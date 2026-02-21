package mongo

import (
	"amar-dera/internal/core/domain"
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type FeedRepository struct {
	collection *mongo.Collection
}

func NewFeedRepository(db *mongo.Database) domain.FeedRepository {
	return &FeedRepository{
		collection: db.Collection("feed_posts"),
	}
}

func (r *FeedRepository) Create(ctx context.Context, post *domain.FeedPost) error {
	_, err := r.collection.InsertOne(ctx, post)
	return err
}

func (r *FeedRepository) GetByID(ctx context.Context, id string) (*domain.FeedPost, error) {
	var post domain.FeedPost
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&post)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &post, nil
}

func (r *FeedRepository) List(ctx context.Context, filter map[string]interface{}) ([]domain.FeedPost, error) {
	query := bson.M{}
	for k, v := range filter {
		query[k] = v
	}

	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := r.collection.Find(ctx, query, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var posts []domain.FeedPost
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, err
	}

	return posts, nil
}

func (r *FeedRepository) Update(ctx context.Context, post *domain.FeedPost) error {
	filter := bson.M{"_id": post.ID}
	update := bson.M{"$set": post}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *FeedRepository) Delete(ctx context.Context, id string) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}
