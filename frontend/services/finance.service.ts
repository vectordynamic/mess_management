import { apiClient } from '../lib/api-client';
import type {
    ServiceCost,
    Payment,
    Bazar,
    DailyMeal,
    MonthlySummary,
    MonthLockStatus,
} from '@/types/finance';

export const financeService = {
    // Service Costs
    async getServiceCosts(messId: string, month: string): Promise<ServiceCost[]> {
        const { data } = await apiClient.get(`/house/${messId}/costs`, { params: { month } });
        return data.data;
    },

    async addServiceCost(cost: ServiceCost): Promise<void> {
        await apiClient.post(`/house/${cost.mess_id}/costs`, cost);
    },

    async deleteServiceCost(messId: string, costId: string): Promise<void> {
        await apiClient.delete(`/house/${messId}/costs/${costId}`);
    },

    // Daily Meals
    async getDailyMeals(messId: string, month: string): Promise<DailyMeal[]> {
        const { data } = await apiClient.get(`/meals/${messId}/daily`, { params: { month } });
        return data.data;
    },

    async batchUpdateMeals(messId: string, meals: DailyMeal[]): Promise<void> {
        await apiClient.post(`/meals/${messId}/update`, meals);
    },

    // Bazar
    async createBazar(bazar: Bazar): Promise<void> {
        await apiClient.post(`/bazar/${bazar.mess_id}/entry`, bazar);
    },

    async getPendingBazars(messId: string): Promise<Bazar[]> {
        const { data } = await apiClient.get(`/bazar/${messId}/pending`);
        return data.data;
    },

    async approveBazar(messId: string, bazarId: string): Promise<void> {
        await apiClient.patch(`/bazar/${messId}/approve/${bazarId}`);
    },

    async updateBazar(messId: string, bazarId: string, bazar: Partial<Bazar>): Promise<void> {
        await apiClient.patch(`/bazar/${messId}/entry/${bazarId}`, bazar);
    },

    async deleteBazar(messId: string, bazarId: string): Promise<void> {
        await apiClient.delete(`/bazar/${messId}/entry/${bazarId}`);
    },

    async getBazars(messId: string, month: string): Promise<Bazar[]> {
        const { data } = await apiClient.get(`/bazar/${messId}/entries`, { params: { month } });
        return data.data;
    },

    // Payments
    async submitPayment(payment: Payment): Promise<void> {
        await apiClient.post(`/payments/${payment.mess_id}/submit`, payment);
    },

    async getPendingPayments(messId: string): Promise<Payment[]> {
        const { data } = await apiClient.get(`/payments/${messId}/pending`);
        return data.data;
    },

    async verifyPayment(messId: string, paymentId: string): Promise<void> {
        await apiClient.patch(`/payments/${messId}/verify/${paymentId}`);
    },

    async getMemberPayments(messId: string): Promise<Payment[]> {
        const { data } = await apiClient.get(`/payments/${messId}/my-history`);
        return data.data;
    },

    async getMessPayments(messId: string, month: string): Promise<Payment[]> {
        const { data } = await apiClient.get(`/payments/${messId}/all-history`, { params: { month } });
        return data.data;
    },

    // Summary
    async getMonthlySummary(messId: string, month: string): Promise<MonthlySummary> {
        const { data } = await apiClient.get(`/summary/${messId}/final`, { params: { month } });
        return data.data;
    },

    // Month Locking
    async requestUnlock(messId: string, month: string): Promise<void> {
        await apiClient.post(`/history/${messId}/unlock-request`, { month });
    },

    async getLockStatus(messId: string, month: string): Promise<MonthLockStatus> {
        const { data } = await apiClient.get(`/history/${messId}/pending-requests`, { params: { month } });
        return data.data;
    },

    async setLockStatus(messId: string, month: string, isLocked: boolean): Promise<void> {
        await apiClient.patch(`/history/${messId}/lock-status`, { month, is_locked: isLocked });
    },
};
