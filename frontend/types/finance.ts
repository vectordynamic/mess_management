// Finance domain types matching backend

export interface ServiceCost {
    id?: string;
    mess_id: string;
    month: string; // YYYY-MM
    name: string;
    amount: number;
    created_by?: string;
    shares?: { user_id: string; amount: number }[];
    status: 'pending' | 'approved';
}

export type PaymentType = 'house' | 'meal';

export interface Payment {
    id?: string;
    user_id: string;
    mess_id: string;
    amount: number;
    type: PaymentType;
    status: 'pending' | 'approved' | 'rejected';
    month: string;
    created_at?: string;
    approved_by?: string;
}

export interface Bazar {
    id?: string;
    mess_id: string;
    buyer_id: string;
    amount: number;
    items: string;
    date: string;
    status: 'pending' | 'approved';
    month: string;
    created_by?: string;
}

export interface DailyMeal {
    id?: string;
    mess_id: string;
    user_id: string;
    date: string;
    breakfast: number;
    lunch: number;
    dinner: number;
    month: string;
}

export interface MonthlySummary {
    month: string;
    total_service_cost: number;
    total_meal_cost: number;
    meal_rate: number;
    total_meals: number;
    member_summaries: Record<string, MemberSummary>;
}

export interface MemberSummary {
    user_id: string;
    name: string;
    total_meals: number;
    meal_cost: number;
    service_share: number;
    bazar_spent: number;
    house_paid: number;
    meal_paid: number;
    total_paid: number;
    total_debit: number;
    total_credit: number;
    house_balance: number;
    meal_balance: number;
    balance: number;
}

export interface MonthLockStatus {
    mess_id: string;
    month: string;
    is_locked: boolean;
    locked_by?: string;
    locked_at?: string;
}
