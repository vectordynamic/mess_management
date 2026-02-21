'use client';

import { useState } from 'react';
import { CreditCard, Plus, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import { messService, MessMember } from '@/services/mess.service';
import { useMessContext } from '@/contexts/MessContext';
import toast from 'react-hot-toast';
import type { Payment } from '@/types/finance';
import Link from 'next/link';
import { NoMessView } from '@/components/shared/NoMessView';
import { formatCurrency } from '@/lib/formatters';

export default function PaymentsPage() {
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const { currentMessId, isManager, isMemberOfAnyMess } = useMessContext();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<Payment>();
    const queryClient = useQueryClient();

    // Fetch pending payments (for managers)
    const { data: pendingPayments = [] } = useQuery({
        queryKey: ['pending-payments', currentMessId],
        queryFn: () => currentMessId ? financeService.getPendingPayments(currentMessId) : Promise.resolve([]),
        enabled: !!currentMessId && isManager,
    });

    // Submit payment mutation
    const submitMutation = useMutation({
        mutationFn: (payment: Payment) => financeService.submitPayment(payment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
            queryClient.invalidateQueries({ queryKey: ['mess-payments'] });
            toast.success('Payment recorded successfully!');
            setShowAddForm(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to submit payment');
        },
    });

    // Verify payment mutation
    const verifyMutation = useMutation({
        mutationFn: ({ messId, paymentId }: { messId: string; paymentId: string }) =>
            financeService.verifyPayment(messId, paymentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
            queryClient.invalidateQueries({ queryKey: ['mess-payments'] });
            toast.success('Payment verified!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to verify payment');
        },
    });

    // Fetch Mess Details (to get members list)
    const { data: mess } = useQuery({
        queryKey: ['mess-details', currentMessId],
        queryFn: () => currentMessId ? messService.getMessDetails(currentMessId) : null,
        enabled: !!currentMessId,
    });

    // Fetch mess payments (for all users - current selected month)
    const { data: messPayments = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['mess-payments', currentMessId, selectedMonth],
        queryFn: () => currentMessId ? financeService.getMessPayments(currentMessId, selectedMonth) : Promise.resolve([]),
        enabled: !!currentMessId,
    });

    const activeMembers = mess?.members.filter((m: MessMember) => m.status === 'active') || [];

    const onSubmit = (data: Payment) => {
        if (!currentMessId) {
            toast.error('Please select a mess first');
            return;
        }
        submitMutation.mutate({
            ...data,
            mess_id: currentMessId,
            status: 'pending',
        });
    };

    const handleVerify = (paymentId: string) => {
        if (!currentMessId) return;
        verifyMutation.mutate({ messId: currentMessId, paymentId });
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
                    <h1 className="text-2xl font-bold text-foreground">Payments</h1>
                    <p className="text-muted-foreground mt-1">Record and track member contributions for meals or house bills.</p>
                </div>
                <button
                    onClick={() => {
                        if (!isManager) {
                            toast.error(
                                (t) => (
                                    <div className="flex flex-col gap-2">
                                        <span className="font-bold">Manager access required</span>
                                        <div className="text-xs opacity-90">
                                            Only managers can record payments. Check who is the manager of this mess.
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
                        setShowAddForm(true);
                    }}
                    className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    <span>Record Member Payment</span>
                </button>
            </div>

            {/* Submit Payment Form (Manager Only) */}
            {isManager && showAddForm && (
                <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Record New Payment</h3>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Payer (Who Paid?)</label>
                                <select
                                    {...register('user_id', { required: 'Payer is required' })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-foreground"
                                >
                                    <option value="" className="bg-card text-foreground">Select Member</option>
                                    {activeMembers.map((member: MessMember) => (
                                        <option key={member.user_id} value={member.user_id} className="bg-card text-foreground">
                                            {member.user_name || member.user_id}
                                        </option>
                                    ))}
                                </select>
                                {errors.user_id && <p className="mt-1 text-sm text-red-600">{errors.user_id.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Month</label>
                                <input
                                    {...register('month', { required: 'Month is required' })}
                                    type="month"
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-foreground"
                                    defaultValue={new Date().toISOString().slice(0, 7)}
                                />
                                {errors.month && <p className="mt-1 text-sm text-red-600">{errors.month.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Amount (৳)</label>
                                <input
                                    {...register('amount', { required: 'Amount is required', valueAsNumber: true })}
                                    type="number"
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-foreground"
                                    placeholder="0"
                                />
                                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Payment Category</label>
                                <select
                                    {...register('type', { required: 'Type is required' })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-foreground"
                                >
                                    <option value="meal" className="bg-card text-foreground">Meal Payment</option>
                                    <option value="house" className="bg-card text-foreground">House Payment (Rent + Bills)</option>
                                </select>
                                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={submitMutation.isPending}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-semibold"
                            >
                                {submitMutation.isPending ? 'Recording...' : 'Record Payment'}
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

            {/* Pending Verifications (Manager Only) */}
            {isManager && pendingPayments.length > 0 && (
                <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Pending Verifications</h3>
                    <div className="space-y-3">
                        {pendingPayments.map((payment: Payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg">
                                <div>
                                    <p className="font-semibold text-foreground">{formatCurrency(payment.amount)}</p>
                                    <p className="text-sm text-muted-foreground">Month: {payment.month}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Type: {payment.type === 'meal' ? 'Meal' : 'House'}</p>
                                </div>
                                <button
                                    onClick={() => payment.id && handleVerify(payment.id)}
                                    disabled={verifyMutation.isPending}
                                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors shadow-sm"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Verify</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment History */}
            <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-foreground">Mess Payment History</h3>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Month:</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-foreground"
                        />
                    </div>
                </div>
                {messPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Payer</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {messPayments.map((payment: Payment) => {
                                    const payer = activeMembers.find((m: MessMember) => m.user_id === payment.user_id);
                                    return (
                                        <tr key={payment.id} className="hover:bg-muted/30">
                                            <td className="px-6 py-4 font-medium text-foreground">{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}</td>
                                            <td className="px-6 py-4 text-foreground font-medium">
                                                {payer ? payer.name || payer.user_name || payer.user_id : payment.user_id || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-foreground">{formatCurrency(payment.amount)}</td>
                                            <td className="px-6 py-4 text-foreground capitalized font-medium">{payment.type}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${payment.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6 text-center py-12">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-muted-foreground">{isLoadingHistory ? 'Loading history...' : 'No payments found for this month'}</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            {isLoadingHistory ? 'Fetching records...' : 'Payments recorded for the mess will appear here'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
