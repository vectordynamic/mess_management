import { apiClient } from '../lib/api-client';

export type FeedCategory = 'house_rent' | 'buy' | 'sell' | 'service' | 'help';

export interface Location {
    city: string;
    area: string;
    address: string;
}

export interface FeedPost {
    id: string;
    user_id: string;
    user_name?: string;
    mess_id: string;
    mess_name?: string;
    category: FeedCategory;
    title: string;
    description: string;
    location: Location;
    contact_info: string;
    price?: number;
    status: 'active' | 'sold' | 'closed';
    created_at: string;
    updated_at: string;
}

export interface CreatePostRequest {
    category: FeedCategory;
    title: string;
    description: string;
    location: Location;
    contact_info: string;
    price?: number;
}

export const feedService = {
    async createPost(post: CreatePostRequest): Promise<FeedPost> {
        const { data } = await apiClient.post('/feed', post);
        return data.data;
    },

    async listPosts(filters?: { category?: string; city?: string; area?: string }): Promise<FeedPost[]> {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.city) params.append('city', filters.city);
        if (filters?.area) params.append('area', filters.area);

        const { data } = await apiClient.get(`/feed?${params.toString()}`);
        return data.data;
    },

    async getPost(id: string): Promise<FeedPost> {
        const { data } = await apiClient.get(`/feed/${id}`);
        return data.data;
    },
};
