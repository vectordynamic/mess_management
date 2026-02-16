'use client';

import { useState, useEffect } from 'react';
import { Utensils, Calendar, Save, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import { messService } from '@/services/mess.service';
import { useMessContext } from '@/contexts/MessContext';
import { DailyMeal, Bazar } from '@/types/finance';
import MealGrid from '@/components/finance/MealGrid';
import BazarLayout from '@/components/finance/BazarLayout';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { NoMessView } from '@/components/shared/NoMessView';

export default function MealsPage() {
    const { currentMessId, isManager, isMemberOfAnyMess, user } = useMessContext();
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [localMeals, setLocalMeals] = useState<DailyMeal[]>([]);
    const [selectedBazarDate, setSelectedBazarDate] = useState<Date | null>(null);
    const queryClient = useQueryClient();

    // Fetch Mess Details (for members)
    const { data: mess } = useQuery({
        queryKey: ['mess-details', currentMessId],
        queryFn: () => currentMessId ? messService.getMessDetails(currentMessId) : null,
        enabled: !!currentMessId,
    });

    // Fetch Meals
    const { data: remoteMeals = [], isLoading: isMealsLoading } = useQuery({
        queryKey: ['meals', currentMessId, selectedMonth],
        queryFn: () => currentMessId ? financeService.getDailyMeals(currentMessId, selectedMonth) : [],
        enabled: !!currentMessId,
    });

    // Fetch Bazars (for Daily Bazar Column)
    const { data: bazars = [] } = useQuery({
        queryKey: ['bazars', currentMessId, selectedMonth],
        queryFn: () => currentMessId ? financeService.getBazars(currentMessId, selectedMonth) : [],
        enabled: !!currentMessId,
    });

    // Sync local state when remote data loads
    useEffect(() => {
        if (remoteMeals) {
            setLocalMeals(remoteMeals);
        }
    }, [remoteMeals]);

    const updateMutation = useMutation({
        mutationFn: (meals: DailyMeal[]) => {
            if (!currentMessId) throw new Error('No Mess ID');
            return financeService.batchUpdateMeals(currentMessId, meals);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals'] });
            queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
            toast.success('Meals updated successfully!');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update meals');
        },
    });

    // Bazar Mutations
    const createBazarMutation = useMutation({
        mutationFn: (data: Bazar) => {
            if (!currentMessId) throw new Error('No Mess ID');
            return financeService.createBazar(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bazars'] });
            queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
            toast.success('Bazar entry added!');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to add bazar entry');
        }
    });

    const updateBazarMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Bazar> }) => {
            if (!currentMessId) throw new Error('No Mess ID');
            return financeService.updateBazar(currentMessId, id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bazars'] });
            queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
            toast.success('Bazar entry updated!');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update bazar entry');
        }
    });

    const deleteBazarMutation = useMutation({
        mutationFn: (id: string) => {
            if (!currentMessId) throw new Error('No Mess ID');
            return financeService.deleteBazar(currentMessId, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bazars'] });
            queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
            toast.success('Bazar entry deleted!');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to delete bazar entry');
        }
    });

    const handleSave = () => {
        if (!isManager) {
            toast.error(
                (t) => (
                    <div className="flex flex-col gap-2">
                        <span className="font-extrabold text-rose-900">Manager Access Required</span>
                        <div className="text-xs text-rose-800 opacity-90 leading-relaxed">
                            Only managers can save batch meal updates. Check your mess details to see available managers.
                        </div>
                        <Link
                            href={`/dashboard/mess/${currentMessId}`}
                            onClick={() => toast.dismiss(t.id)}
                            className="bg-white text-rose-600 px-3 py-2 rounded-xl text-[10px] font-black tracking-tight text-center border border-rose-200 hover:bg-rose-50 transition-all uppercase shadow-sm"
                        >
                            View Members & Managers
                        </Link>
                    </div>
                ),
                {
                    duration: 6000,
                    position: 'top-center',
                    style: {
                        border: '1px solid #fee2e2',
                        background: '#fff1f2',
                        padding: '16px',
                        borderRadius: '24px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                    }
                }
            );
            return;
        }
        updateMutation.mutate(localMeals);
    };

    if (!isMemberOfAnyMess) {
        return <NoMessView />;
    }

    if (!currentMessId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Utensils className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No Mess Selected</h3>
                <p className="text-muted-foreground mt-2">Please select a mess from the sidebar first</p>
            </div>
        );
    }

    const filteredBazars = selectedBazarDate
        ? (bazars || []).filter((b: Bazar) => b.date && format(new Date(b.date), 'yyyy-MM-dd') === format(selectedBazarDate, 'yyyy-MM-dd'))
        : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight">Daily Meal Sheet</h1>
                    <p className="text-muted-foreground">Track and manage daily meal consumption counts</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="bg-card p-1 rounded-xl shadow-sm border border-border flex items-center">
                        <div className="pl-3 pr-1 py-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none rounded-lg px-3 py-1.5 text-sm font-bold text-foreground focus:ring-0 outline-none cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-none transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{updateMutation.isPending ? 'Saving...' : 'Save Draft'}</span>
                    </button>
                </div>
            </div>

            {isMealsLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                <MealGrid
                    messId={currentMessId}
                    month={selectedMonth}
                    members={mess?.members || []}
                    meals={localMeals}
                    bazars={bazars || []}
                    onUpdateMeals={setLocalMeals}
                    isEditable={true}
                    onBazarClick={(date) => setSelectedBazarDate(date)}
                />
            )}

            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-800">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-2 flex items-center">
                    <Utensils className="w-4 h-4 mr-2" />
                    How it works
                </h4>
                <ul className="text-sm text-amber-800 dark:text-amber-400/80 space-y-1 opacity-80">
                    <li>• Enter meal counts (1, 0.5, 0) for Lunch (L) and Dinner (D).</li>
                    <li>• Click on the <strong>Bazar</strong> cell to add/edit daily shopping costs.</li>
                    <li>• Only Managers can save batch meal updates permanently.</li>
                    <li>• Totals are automatically calculated at the bottom.</li>
                </ul>
            </div>

            {selectedBazarDate && (
                <BazarLayout
                    date={selectedBazarDate}
                    messId={currentMessId}
                    members={mess?.members || []}
                    existingBazars={filteredBazars}
                    onClose={() => setSelectedBazarDate(null)}
                    onCreate={(data) => createBazarMutation.mutate(data)}
                    onUpdate={(id, data) => updateBazarMutation.mutate({ id, data })}
                    onDelete={(id) => deleteBazarMutation.mutate(id)}
                    currentUserId={user?.id || ''}
                    isManager={isManager}
                />
            )}
        </div>
    );
}
