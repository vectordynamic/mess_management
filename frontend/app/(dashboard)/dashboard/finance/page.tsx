'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DollarSign, Utensils, ShoppingCart, CreditCard,
    TrendingUp, Users, AlertCircle, CheckCircle2,
    ArrowRight, ChevronRight, Plus, Eye, Home, Info, HelpCircle, Calendar
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import { useMessContext } from '@/contexts/MessContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { NoMessView } from '@/components/shared/NoMessView';
import { formatCurrency } from '@/lib/formatters';
import AddCostModal from '@/components/finance/AddCostModal';

export default function FinanceOverviewPage() {
    const { currentMessId, isManager, isMemberOfAnyMess } = useMessContext();
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [showAddCost, setShowAddCost] = useState(false);
    const queryClient = useQueryClient();

    // Fetch Summary
    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['monthly-summary', currentMessId, selectedMonth],
        queryFn: () => currentMessId ? financeService.getMonthlySummary(currentMessId, selectedMonth) : null,
        enabled: !!currentMessId,
    });

    // Fetch Service Costs for Breakdown Table
    const { data: serviceCosts = [] } = useQuery({
        queryKey: ['service-costs', currentMessId, selectedMonth],
        queryFn: () => currentMessId ? financeService.getServiceCosts(currentMessId, selectedMonth) : [],
        enabled: !!currentMessId,
    });

    const memberList = useMemo(() => {
        return summary?.member_summaries ? Object.values(summary.member_summaries) : [];
    }, [summary]);

    const activeMemberCount = memberList.length || 1;

    if (!isMemberOfAnyMess) {
        return <NoMessView />;
    }

    if (!currentMessId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Mess Selected</h3>
                <p className="text-gray-500 mt-2 text-center max-w-sm">
                    Please select a mess from the sidebar to view finance details.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Finance Overview</h1>
                    <p className="text-muted-foreground font-medium text-sm sm:text-base">Monthly Consolidated Balance Sheet</p>
                </div>

                <div className="flex items-center space-x-3 bg-card p-1.5 rounded-2xl shadow-sm border border-border">
                    <div className="pl-3 pr-1 py-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Period</span>
                    </div>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer placeholder:text-muted-foreground/50"
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card p-4 sm:p-6 rounded-2xl shadow-sm border border-border">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
                        <p className="text-muted-foreground text-sm">Manage your mess finances efficiently</p>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <Link href={`/dashboard/finance/payments`} className="flex-1 md:flex-none">
                            <button className="w-full md:w-auto flex items-center justify-center space-x-2 bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0">
                                <CreditCard className="w-4 h-4" />
                                <span>Record Payment</span>
                            </button>
                        </Link>

                        <button
                            onClick={() => {
                                if (!isManager) {
                                    toast.error(
                                        (t) => (
                                            <div className="flex flex-col gap-2">
                                                <span className="font-extrabold text-destructive">Manager Access Required</span>
                                                <div className="text-xs text-destructive/90 leading-relaxed font-medium">
                                                    Only managers can add mess service costs. Visit your mess details to see who are the authorized managers.
                                                </div>
                                                <Link
                                                    href={`/dashboard/mess/${currentMessId}`}
                                                    onClick={() => toast.dismiss(t.id)}
                                                    className="bg-background text-destructive px-4 py-2 rounded-xl text-[10px] font-black tracking-tight text-center border border-destructive/20 hover:bg-destructive/10 transition-all uppercase shadow-md active:scale-95"
                                                >
                                                    View Members & Managers
                                                </Link>
                                            </div>
                                        ),
                                        {
                                            duration: 6000,
                                            position: 'top-center',
                                            style: {
                                                border: '1px solid var(--destructive)',
                                                background: 'var(--background)',
                                                color: 'var(--foreground)',
                                                padding: '16px',
                                                borderRadius: '24px',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                                            }
                                        }
                                    );
                                    return;
                                }
                                setShowAddCost(true);
                            }}
                            className="flex-1 md:flex-none w-full md:w-auto flex items-center justify-center space-x-2 bg-indigo-600 dark:bg-indigo-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Cost</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Visual Logic Help Box */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-blue-600 dark:bg-blue-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="flex items-center space-x-3 mb-4">
                        <Home className="w-6 h-6" />
                        <h3 className="text-lg font-black uppercase tracking-wider">House Accounting Logic</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end border-b border-white/20 pb-2">
                            <span className="text-xs font-bold text-blue-100 uppercase">Total Monthly Bills</span>
                            <span className="text-xl font-black">{formatCurrency(summary?.total_service_cost || 0)}</span>
                        </div>
                        <div className="text-sm font-medium text-blue-100">
                            <span className="font-black text-white px-2 italic">Variable Split</span> based on cost settings.
                        </div>
                    </div>
                </div>

                <div className="bg-orange-600 dark:bg-orange-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="flex items-center space-x-3 mb-4">
                        <Utensils className="w-6 h-6" />
                        <h3 className="text-lg font-black uppercase tracking-wider">Meal Accounting Logic</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end border-b border-white/20 pb-2">
                            <span className="text-xs font-bold text-orange-100 uppercase">Total Bazar Cost / Total Meals</span>
                            <span className="text-xl font-black">{formatCurrency(summary?.meal_rate || 0)} / meal</span>
                        </div>
                        <div className="text-sm font-medium text-orange-100">
                            Calculation: <span className="font-black text-white px-2 italic">Your Eat Count × Meal Rate</span> = Your Cost
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Breakdown Tables */}
            <div className="grid grid-cols-1 gap-12">

                {/* House Account Summary */}
                <div className="bg-card rounded-[40px] shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-6 sm:px-8 bg-muted/30 flex items-center justify-between border-b border-border">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Home className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight leading-none mb-1">House Account Status</h3>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest break-words">Share based on Rent + Utilities</p>
                            </div>
                        </div>
                        <div className="md:flex items-center hidden space-x-6 text-right">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Members</p>
                                <p className="text-lg font-black text-primary">{activeMemberCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border">
                                    <th className="px-6 sm:px-8 py-4 whitespace-nowrap">Participant</th>
                                    <th className="px-6 py-4 text-right whitespace-nowrap">Debit (Share)</th>
                                    <th className="px-6 py-4 text-right whitespace-nowrap">Credit (Paid)</th>
                                    <th className="px-6 sm:px-8 py-4 text-right whitespace-nowrap">Consolidated Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {memberList.map((m) => (
                                    <tr key={`${m.user_id}_house`} className="hover:bg-muted/50 transition-colors group">
                                        <td className="px-6 sm:px-8 py-6">
                                            <span className="font-black text-foreground block text-lg uppercase whitespace-nowrap">{m.name || 'Unknown'}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Verified Member</span>
                                        </td>
                                        <td className="px-6 py-6 text-right font-black text-muted-foreground whitespace-nowrap">{formatCurrency(m.service_share || 0)}</td>
                                        <td className="px-6 py-6 text-right font-black text-emerald-600 text-lg whitespace-nowrap">{formatCurrency(m.house_paid || 0)}</td>
                                        <td className="px-6 sm:px-8 py-6 text-right whitespace-nowrap">
                                            <span className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-[18px] text-sm font-black shadow-sm ring-1 ${m.house_balance >= 0 ? 'bg-emerald-500 text-white ring-emerald-400' : 'bg-rose-500 text-white ring-rose-400'}`}>
                                                {m.house_balance >= 0 ? '+' : ''}{formatCurrency(m.house_balance || 0)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Meal Account Summary */}
                <div className="bg-card rounded-[40px] shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-6 sm:px-8 bg-muted/30 flex items-center justify-between border-b border-border">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                <Utensils className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight leading-none mb-1">Meal Account Status</h3>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Share based on Consumption</p>
                            </div>
                        </div>
                        <div className="md:flex items-center hidden space-x-6 text-right">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Meal Rate</p>
                                <p className="text-lg font-black text-orange-600">{formatCurrency(summary?.meal_rate || 0)}</p>
                            </div>
                            <div className="w-px h-8 bg-border"></div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Mess Meals</p>
                                <p className="text-lg font-black text-foreground">{summary?.total_meals?.toString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border">
                                    <th className="px-6 sm:px-8 py-4 whitespace-nowrap">Participant</th>
                                    <th className="px-6 py-4 text-center whitespace-nowrap">Meals Eaten</th>
                                    <th className="px-6 py-4 text-right whitespace-nowrap">Debit (Cost)</th>
                                    <th className="px-6 py-4 text-right whitespace-nowrap">Total Paid</th>
                                    <th className="px-6 sm:px-8 py-4 text-right whitespace-nowrap">Final Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {memberList.map((m) => (
                                    <tr key={`${m.user_id}_meal`} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 sm:px-8 py-6 font-black text-foreground text-lg uppercase whitespace-nowrap">{m.name || 'Unknown'}</td>
                                        <td className="px-6 py-6 text-center whitespace-nowrap">
                                            <span className="font-black bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-xs">
                                                {m.total_meals} meals
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right font-black text-muted-foreground whitespace-nowrap">{formatCurrency(m.meal_cost || 0)}</td>
                                        <td className="px-6 py-6 text-right whitespace-nowrap">
                                            <span className="font-black text-emerald-600 text-lg">{formatCurrency(m.meal_paid)}</span>
                                        </td>
                                        <td className="px-6 sm:px-8 py-6 text-right whitespace-nowrap">
                                            <span className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-[18px] text-sm font-black shadow-sm ring-1 ${m.meal_balance >= 0 ? 'bg-orange-500 text-white ring-orange-400' : 'bg-rose-500 text-white ring-rose-400'}`}>
                                                {m.meal_balance >= 0 ? '+' : ''}{formatCurrency(m.meal_balance || 0)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Individual Service Breakdown Card */}
                <div className="lg:col-span-1 bg-card rounded-[40px] shadow-sm border border-border overflow-hidden flex flex-col h-full">
                    <div className="p-8 bg-muted/50 border-b border-border flex items-center justify-between text-foreground">
                        <div className="flex items-center space-x-3">
                            <Info className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-black uppercase text-xs tracking-widest">Monthly Service Costs (Total)</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-border flex-1">
                        {serviceCosts?.length > 0 ? (
                            serviceCosts.filter(c => c.status === 'approved').map(c => (
                                <div key={c.id} className="flex justify-between items-center p-6 group hover:bg-muted/30 transition-colors">
                                    <div>
                                        <p className="font-black text-foreground text-lg">{c.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
                                    </div>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-2xl ring-1 ring-emerald-100 dark:ring-emerald-900 scale-110 group-hover:scale-125 transition-transform">{formatCurrency(c.amount || 0)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="p-16 text-center text-muted-foreground italic">No approved service costs this month</div>
                        )}
                    </div>
                    <div className="p-8 bg-emerald-600 text-white text-center font-black uppercase tracking-widest flex items-center justify-between">
                        <span>Grand Total House Bills:</span>
                        <span className="text-2xl">{formatCurrency(summary?.total_service_cost || 0)}</span>
                    </div>
                </div>
            </div>


            <AddCostModal
                isOpen={showAddCost}
                onClose={() => setShowAddCost(false)}
                currentMonth={selectedMonth}
            />
        </div >
    );
}
