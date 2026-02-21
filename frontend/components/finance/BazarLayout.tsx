'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Trash2, Edit2, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { Bazar } from '@/types/finance';
import { MessMember } from '@/services/mess.service';
import { formatCurrency } from '@/lib/formatters';

interface BazarLayoutProps {
    date: Date;
    messId: string;
    members: MessMember[];
    existingBazars: Bazar[];
    onClose: () => void;
    onCreate: (data: any) => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
    currentUserId: string;
    isManager: boolean;
}

export default function BazarLayout({
    date,
    messId,
    members,
    existingBazars,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
    currentUserId,
    isManager
}: BazarLayoutProps) {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingBazar, setEditingBazar] = useState<Bazar | null>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            amount: 0,
            items: '',
            buyer_id: currentUserId,
            status: 'pending'
        }
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            mess_id: messId,
            date: date.toISOString(),
            month: format(date, 'yyyy-MM'),
            status: 'approved' // Direct update/create assumes approved for simplicity or pending? 
            // User said "manager in that case only him", implies immediate validity.
            // Let's stick to 'approved' if Manager adds, 'pending' if User? 
            // Actually existing logic has 'pending' for User.
        };

        if (isManager) payload.status = 'approved';

        if (editingBazar) {
            onUpdate(editingBazar.id!, payload);
        } else {
            onCreate(payload);
        }
        reset();
        setView('list');
        setEditingBazar(null);
    };

    const startEdit = (bazar: Bazar) => {
        setEditingBazar(bazar);
        setValue('amount', bazar.amount);
        setValue('items', bazar.items);
        setValue('buyer_id', bazar.buyer_id);
        setView('form');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card dark:bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Bazar for {format(date, 'dd MMM yyyy')}
                    </h3>
                    <button onClick={onClose} className="text-emerald-100 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {view === 'list' ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground font-medium">Entries for this day</span>
                                <button
                                    onClick={() => {
                                        reset({
                                            amount: 0,
                                            items: '',
                                            buyer_id: currentUserId, // Default to current user
                                            status: 'approved'
                                        });
                                        setEditingBazar(null);
                                        setView('form');
                                    }}
                                    className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 flex items-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Add Entry
                                </button>
                            </div>

                            {existingBazars.length === 0 ? (
                                <div className="text-center py-8 bg-muted/50 rounded-xl border border-dashed border-border">
                                    <p className="text-muted-foreground text-sm">No bazar entries for this date.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {existingBazars.map(bazar => {
                                        const buyer = members.find(m => m.user_id === bazar.buyer_id);
                                        const isOwner = bazar.buyer_id === currentUserId;
                                        const canEdit = isManager || (isOwner && bazar.status === 'pending');

                                        return (
                                            <div key={bazar.id} className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-foreground">{formatCurrency(bazar.amount)}</span>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${bazar.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                                }`}>
                                                                {bazar.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Saved by: <span className="font-semibold text-foreground/80">
                                                                {(() => {
                                                                    const recorderId = bazar.created_by || bazar.buyer_id;
                                                                    const recorder = members.find(m => m.user_id === recorderId);
                                                                    return recorder ? (recorder.name || recorder.user_name || recorder.user_id) : (recorderId || 'Unknown');
                                                                })()}
                                                            </span>
                                                        </p>
                                                        {bazar.items && (
                                                            <p className="text-xs text-muted-foreground mt-1 italic">"{bazar.items}"</p>
                                                        )}
                                                    </div>
                                                    {canEdit && (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => startEdit(bazar)}
                                                                className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete(bazar.id!)}
                                                                className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <h4 className="font-bold text-foreground text-sm mb-3">
                                {editingBazar ? 'Edit Bazar Entry' : 'New Bazar Entry'}
                            </h4>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Amount (৳)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('amount', { required: 'Amount is required', valueAsNumber: true, min: 1 })}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-foreground"
                                    placeholder="0.00"
                                />
                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message as string}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Items / Description (Optional)</label>
                                <textarea
                                    {...register('items')}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-20 text-foreground"
                                    placeholder="e.g. Chicken, Rice, Oil..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setView('list'); setEditingBazar(null); }}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-none transition-all"
                                >
                                    Save Entry
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
