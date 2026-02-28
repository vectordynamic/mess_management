import { apiClient } from '../lib/api-client';

export interface Mess {
    id: string;
    name: string;
    admin_id: string;
    members: MessMember[];
    created_at: string;
}

export interface MessMember {
    user_id: string;
    user_name?: string;
    name?: string;
    roles: Role[];
    joined_at: string;
    status: 'active' | 'pending' | 'left';
}

export type Role = 'admin' | 'manager' | 'meal_manager' | 'member';

export interface JoinRequest {
    user_id: string;
    mess_id: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
}

export const messService = {
    async createMess(name: string): Promise<Mess> {
        const { data } = await apiClient.post('/mess/create', { name });
        return data.data;
    },

    async joinMess(messId: string): Promise<void> {
        await apiClient.post('/mess/join', { mess_id: messId });
    },

    async getRequests(messId: string): Promise<JoinRequest[]> {
        const { data } = await apiClient.get(`/mess/${messId}/requests`);
        return data.data;
    },

    async approveMember(messId: string, memberId: string): Promise<void> {
        await apiClient.patch(`/mess/${messId}/requests/approve`, { user_id: memberId });
    },

    async assignRole(messId: string, userId: string, role: Role): Promise<void> {
        await apiClient.patch(`/mess/${messId}/roles`, { user_id: userId, role });
    },

    async removeRole(messId: string, userId: string, role: Role): Promise<void> {
        await apiClient.delete(`/mess/${messId}/roles`, { data: { user_id: userId, role } });
    },

    async getMessDetails(messId: string): Promise<Mess> {
        const { data } = await apiClient.get(`/mess/${messId}/details`);
        return data.data;
    },
    async leaveMess(messId: string): Promise<void> {
        await apiClient.post(`/mess/${messId}/leave`);
    },
};
