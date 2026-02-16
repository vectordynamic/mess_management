'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import { useMessContext } from '@/contexts/MessContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Bazar } from '@/types/finance';
import { NoMessView } from '@/components/shared/NoMessView';
import { formatCurrency } from '@/lib/formatters';

export default function BazarPage() {
    const [showAddForm, setShowAddForm] = useState(false);
    const { currentMessId, isManager, isMemberOfAnyMess } = useMessContext();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<Bazar>();
    const queryClient = useQueryClient();

    // Fetch pending bazars (for managers)
    const { data: pendingBazars = [] } = useQuery({
        queryKey: ['pending-bazars', currentMessId],
        queryFn: () => currentMessId ? financeService.getPendingBazars(currentMessId) : Promise.resolve([]),
        enabled: !!currentMessId && isManager,
    });

    // Create bazar mutation
    const createMutation = useMutation({
        mutationFn: (bazar: Bazar) => financeService.createBazar(bazar),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-bazars'] });
            toast.success('Bazar entry submitted for approval!');
            setShowAddForm(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to submit bazar');
        },
    });

    // Approve bazar mutation
    const approveMutation = useMutation({
        mutationFn: ({ messId, bazarId }: { messId: string; bazarId: string }) =>
            financeService.approveBazar(messId, bazarId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-bazars'] });
            toast.success('Bazar approved!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to approve bazar');
        },
    });

    const onSubmit = (data: Bazar) => {
        if (!currentMessId) {
            toast.error('Please select a mess first');
            return;
        }
        const currentMonth = new Date().toISOString().slice(0, 7);
        createMutation.mutate({
            ...data,
            mess_id: currentMessId,
            buyer_id: '', // Will be set by backend from auth
            month: currentMonth,
            status: 'pending',
        });
    };

    const handleApprove = (bazarId: string) => {
        if (!currentMessId) return;
        approveMutation.mutate({ messId: currentMessId, bazarId });
    };

    if (!isMemberOfAnyMess) {
        return <NoMessView />;
    }

    if (!currentMessId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-gray-600">Please select or join a mess first</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Bazar Entries</h1>
                    <p className="text-muted-foreground mt-1">Submit and manage bazar expenses</p>
                </div>
                <button
                    onClick={() => {
                        if (!isManager) {
                            toast.error(
                                (t) => (
                                    <div className="flex flex-col gap-2">
                                        <span className="font-bold">Manager access required</span>
                                        <div className="text-xs opacity-90">
                                            Only managers can submit or approve bazar entries. Check who is the manager of this mess.
                                        </div>
                                        <Link
                                            href={`/dashboard/mess/${currentMessId}`}
                                            onClick={() => toast.dismiss(t.id)}
                                            className="bg-card text-rose-600 px-3 py-1.5 rounded-lg text-xs font-black text-center border border-rose-100 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors uppercase"
                                        >
                                            View Members & Managers
                                        </Link>
                                    </div>
                                ),
                                { duration: 5000, position: 'top-center', style: { border: '1px solid #fee2e2', background: '#fff1f2', color: '#9f1239', padding: '16px', borderRadius: '20px' } }
                            );
                            return;
                        }
                        setShowAddForm(!showAddForm);
                    }}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Bazar</span>
                </button>
            </div>

            {/* Add Bazar Form */}
            {showAddForm && (
                <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Add Bazar Entry</h3>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Date</label>
                                <input
                                    {...register('date', { required: 'Date is required' })}
                                    type="date"
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-foreground"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                />
                                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Amount (৳)</label>
                                <input
                                    {...register('amount', { required: 'Amount is required', valueAsNumber: true })}
                                    type="number"
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-foreground"
                                    placeholder="0"
                                />
                                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Items Description</label>
                            <textarea
                                {...register('items', { required: 'Items description is required' })}
                                rows={3}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-foreground"
                                placeholder="e.g., Rice, vegetables, fish, spices..."
                            />
                            {errors.items && <p className="mt-1 text-sm text-red-600">{errors.items.message}</p>}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors font-semibold"
                            >
                                {createMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-6 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Pending Approvals (Manager Only) */}
            {isManager && pendingBazars.length > 0 && (
                <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Pending Approvals</h3>
                    <div className="space-y-3">
                        {pendingBazars.map((bazar) => (
                            <div key={bazar.id} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                                <div>
                                    <p className="font-semibold text-foreground">{formatCurrency(bazar.amount)}</p>
                                    <p className="text-sm text-muted-foreground">{bazar.items}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(bazar.date).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => bazar.id && handleApprove(bazar.id)}
                                    disabled={approveMutation.isPending}
                                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors shadow-sm"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Approve</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bazar Entries List */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Recent Entries</h3>
                </div>
                <div className="p-6">
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-muted-foreground">No bazar entries yet</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Submit your first bazar expense</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
