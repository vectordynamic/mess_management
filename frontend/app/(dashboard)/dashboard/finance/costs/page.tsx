'use client';

import { useState } from 'react';
import { DollarSign, Plus, Trash2, Tag, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import { useMessContext } from '@/contexts/MessContext';
import toast from 'react-hot-toast';
import type { ServiceCost } from '@/types/finance';
import { NoMessView } from '@/components/shared/NoMessView';
import { formatCurrency } from '@/lib/formatters';
import AddCostModal from '@/components/finance/AddCostModal';

export default function CostsPage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const { currentMessId, isManager, isMemberOfAnyMess } = useMessContext();
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const queryClient = useQueryClient();

    // Fetch costs
    const { data: costs = [], isLoading } = useQuery({
        queryKey: ['service-costs', currentMessId, selectedMonth],
        queryFn: () => currentMessId ? financeService.getServiceCosts(currentMessId, selectedMonth) : Promise.resolve([]),
        enabled: !!currentMessId,
    });

    // Fetch summary to get active member count
    const { data: summary } = useQuery({
        queryKey: ['monthly-summary', currentMessId, selectedMonth],
        queryFn: () => currentMessId ? financeService.getMonthlySummary(currentMessId, selectedMonth) : null,
        enabled: !!currentMessId,
    });

    const memberCount = summary ? Object.keys(summary.member_summaries).length : 1;

    // Delete cost mutation
    const deleteMutation = useMutation({
        mutationFn: ({ messId, costId }: { messId: string; costId: string }) =>
            financeService.deleteServiceCost(messId, costId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-costs'] });
            queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
            toast.success('Cost deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete cost');
        },
    });

    const handleDelete = (costId: string) => {
        if (!currentMessId) return;

        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-bold text-gray-800 dark:text-gray-100">Delete this cost?</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            deleteMutation.mutate({ messId: currentMessId, costId });
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-600"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm font-bold hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 4000,
            position: 'top-center',
            style: {
                background: 'var(--card)', // This might need inline style or tailwind variable if not global
                // Let's use hardcoded adaptive colors or standard system styles for safety if vars aren't reliable in toast styles context
                // actually 'var(--card)' should work if defined in :root.
                // But let's stick to safe inline styles or just let toast handle default with className if supported.
                // react-hot-toast styles are js objects.
            },
            className: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl'
        });
    };

    if (!isMemberOfAnyMess) {
        return <NoMessView />;
    }

    if (!currentMessId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <DollarSign className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">No Mess Selected</h3>
                <p className="text-gray-500 mt-2 text-sm text-center">Please select a mess from the sidebar first</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Monthly Service Costs</h1>
                    <p className="text-muted-foreground font-medium">Add and manage shared costs like Rent, Electricity, and Utilities</p>
                </div>
                {isManager && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-bold">Add New Cost</span>
                    </button>
                )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 flex items-start space-x-4">
                <div className="bg-blue-500 text-white p-2 rounded-xl mt-0.5 shadow-sm shadow-blue-100 dark:shadow-none">
                    <Info className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center">
                        Shared Accounting Model
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                        Costs can be split Equally among all active members or via Custom Amount for each member.
                        Managers can choose the split method when adding a cost.
                    </p>
                </div>
            </div>

            {/* Month Selector */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-5 flex items-center space-x-4">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">Active Month</label>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-muted border-none rounded-xl px-4 py-2 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                />
            </div>

            {/* Costs List */}
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 bg-muted/30 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-foreground tracking-tight">
                            Expenses for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">All approved shared costs for this period</p>
                    </div>
                    <div className="bg-card px-4 py-1.5 rounded-xl border border-border shadow-sm">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-2">Count:</span>
                        <span className="font-black text-primary">{costs?.length || 0}</span>
                    </div>
                </div>
                <div className="p-6">
                    {isLoading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Records...</p>
                        </div>
                    ) : costs?.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                {costs.map((cost) => (
                                    <div
                                        key={cost.id}
                                        className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <DollarSign className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground text-lg tracking-tight">{cost.name}</p>
                                                <div className="flex items-center mt-1 space-x-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${cost.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                                        {cost.status}
                                                    </span>
                                                    {cost.shares && cost.shares.length > 0 && (
                                                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                                            Custom Split
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Added {new Date().toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-6">
                                            <p className="text-2xl font-black text-foreground">{formatCurrency(cost.amount || 0)}</p>
                                            {isManager && (
                                                <button
                                                    onClick={() => cost.id && handleDelete(cost.id)}
                                                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-8 bg-card border-2 border-primary/10 rounded-3xl flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                <div className="mb-4 md:mb-0 relative z-10">
                                    <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Total Monthly Cost</p>
                                    <h4 className="text-4xl font-black text-primary mt-1">{formatCurrency(costs?.reduce((sum: number, cost: ServiceCost) => sum + cost.amount, 0) || 0)}</h4>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                            <div className="w-20 h-20 bg-card shadow-sm border border-border rounded-3xl flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                                <DollarSign className="w-10 h-10" />
                            </div>
                            <p className="text-lg font-black text-foreground tracking-tight">No Costs Recorded</p>
                            <p className="text-sm text-muted-foreground mt-2 font-medium">Managers can record shared expenses for this month.</p>
                            {isManager && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="mt-6 text-primary font-black uppercase text-xs tracking-widest hover:underline underline-offset-4"
                                >
                                    Record First Expense
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AddCostModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                currentMonth={selectedMonth}
            />
        </div>
    );
}
