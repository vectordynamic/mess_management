'use client';

import React, { useMemo } from 'react';
import {
    format,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    getDate,
    isSameDay
} from 'date-fns';
import { DailyMeal, Bazar } from '@/types/finance';
import { MessMember } from '@/services/mess.service';

interface MealGridProps {
    messId: string;
    month: string; // YYYY-MM
    members: MessMember[];
    meals: DailyMeal[];
    bazars: Bazar[];
    onUpdateMeals: (meals: DailyMeal[]) => void;
    isEditable?: boolean;
    onBazarClick?: (date: Date) => void;
}

export default function MealGrid({ messId, month, members, meals, bazars, onUpdateMeals, isEditable = true, onBazarClick }: MealGridProps) {
    const days = useMemo(() => {
        const start = startOfMonth(new Date(month + '-01'));
        const end = endOfMonth(start);
        return eachDayOfInterval({ start, end });
    }, [month]);

    const getDailyBazarTotal = (date: Date) => {
        return (bazars || [])
            .filter(b => b.date && isSameDay(new Date(b.date), date) && b.status === 'approved')
            .reduce((sum, b) => sum + b.amount, 0);
    };

    const getMealValue = (userId: string, date: Date, type: 'breakfast' | 'lunch' | 'dinner') => {
        const meal = (meals || []).find(m => m.user_id === userId && m.date && isSameDay(new Date(m.date), date));
        if (!meal) return '';
        const val = type === 'breakfast' ? meal.breakfast : (type === 'lunch' ? meal.lunch : meal.dinner);
        return val === 0 ? '' : val.toString();
    };

    const handleMealChange = (userId: string, date: Date, type: 'breakfast' | 'lunch' | 'dinner', value: string) => {
        if (!isEditable) return;

        const numVal = parseFloat(value) || 0;
        const normalizedDate = format(date, 'yyyy-MM-dd');

        // Find existing meal or create new
        const existingMealIndex = (meals || []).findIndex(m => m.user_id === userId && m.date && format(new Date(m.date), 'yyyy-MM-dd') === normalizedDate);

        let updatedMeals = [...(meals || [])];
        if (existingMealIndex > -1) {
            updatedMeals[existingMealIndex] = {
                ...updatedMeals[existingMealIndex],
                [type]: numVal
            };
        } else {
            updatedMeals.push({
                user_id: userId,
                date: new Date(normalizedDate).toISOString(),
                breakfast: type === 'breakfast' ? numVal : 0,
                lunch: type === 'lunch' ? numVal : 0,
                dinner: type === 'dinner' ? numVal : 0,
                month: month,
                mess_id: messId
            } as DailyMeal);
        }

        onUpdateMeals(updatedMeals);
    };

    return (
        <div className="relative overflow-x-auto bg-card rounded-xl shadow-md border border-border h-[650px]">
            <table className="min-w-full border-separate border-spacing-0 text-[11px]">
                <thead className="sticky top-0 z-30">
                    <tr className="bg-muted text-foreground">
                        <th className="border-b border-r border-border px-2 py-3 sticky left-0 z-40 bg-muted min-w-[50px]">
                            Date
                        </th>
                        {members.map((member, i) => {
                            const isViolet = i % 2 === 0;
                            return (
                                <th
                                    key={member.user_id}
                                    colSpan={3}
                                    className={`border-b border-r border-border px-1 py-3 text-center truncate max-w-[100px] font-black uppercase tracking-tighter ${isViolet ? 'text-violet-600 dark:text-violet-400 bg-violet-50/30 dark:bg-violet-900/10' : 'text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10'
                                        }`}
                                >
                                    {member.name || member.user_name || member.user_id.slice(0, 6)}
                                </th>
                            );
                        })}
                        <th className="border-b border-border px-2 py-3 bg-amber-600 dark:bg-amber-700 sticky right-0 z-40 text-amber-50">Bazar</th>
                    </tr>
                    <tr className="bg-muted/50 text-foreground shadow-sm font-bold">
                        <th className="border-b border-r border-border px-1 py-1 sticky left-0 z-40 bg-muted/50 italic">DATE</th>
                        {members.map((member, i) => {
                            const isViolet = i % 2 === 0;
                            const subHeaderClass = isViolet ? 'bg-violet-100/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'bg-blue-100/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
                            return (
                                <React.Fragment key={`${member.user_id}-bld`}>
                                    <th className={`border-b border-r border-border px-0.5 py-1 w-8 text-center ${subHeaderClass}`}>B</th>
                                    <th className={`border-b border-r border-border px-0.5 py-1 w-8 text-center ${subHeaderClass}`}>L</th>
                                    <th className={`border-b border-r border-border px-0.5 py-1 w-8 text-center ${subHeaderClass}`}>D</th>
                                </React.Fragment>
                            );
                        })}
                        <th className="border-b border-border px-1 py-1 sticky right-0 z-40 bg-muted/50">TOTAL</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {days.map(day => {
                        const bazarTotal = getDailyBazarTotal(day);
                        return (
                            <tr key={day.toISOString()} className="hover:bg-muted/30 transition-colors group">
                                <td className="border-b border-r border-border px-2 py-1.5 text-center font-black sticky left-0 z-20 bg-card group-hover:bg-muted/30 transition-colors text-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {getDate(day)}
                                </td>
                                {members.map((member, i) => {
                                    const isViolet = i % 2 === 0;
                                    const cellClass = isViolet ? 'bg-violet-50/10 dark:bg-violet-900/5' : 'bg-blue-50/10 dark:bg-blue-900/5';
                                    const focusClass = isViolet ? 'focus:bg-violet-100 dark:focus:bg-violet-900/40' : 'focus:bg-blue-100 dark:focus:bg-blue-900/40';

                                    return (
                                        <React.Fragment key={`${day.toISOString()}-${member.user_id}`}>
                                            <td className={`border-b border-r border-border p-0 text-center relative ${cellClass}`}>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className={`w-full h-8 text-center focus:outline-none bg-transparent font-bold text-foreground ${focusClass}`}
                                                    value={getMealValue(member.user_id, day, 'breakfast')}
                                                    onChange={(e) => handleMealChange(member.user_id, day, 'breakfast', e.target.value)}
                                                    disabled={!isEditable}
                                                />
                                            </td>
                                            <td className={`border-b border-r border-border p-0 text-center relative ${cellClass}`}>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className={`w-full h-8 text-center focus:outline-none bg-transparent font-bold text-foreground ${focusClass}`}
                                                    value={getMealValue(member.user_id, day, 'lunch')}
                                                    onChange={(e) => handleMealChange(member.user_id, day, 'lunch', e.target.value)}
                                                    disabled={!isEditable}
                                                />
                                            </td>
                                            <td className={`border-b border-r border-border p-0 text-center relative ${cellClass}`}>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className={`w-full h-8 text-center focus:outline-none bg-transparent font-bold text-foreground ${focusClass}`}
                                                    value={getMealValue(member.user_id, day, 'dinner')}
                                                    onChange={(e) => handleMealChange(member.user_id, day, 'dinner', e.target.value)}
                                                    disabled={!isEditable}
                                                />
                                            </td>
                                        </React.Fragment>
                                    );
                                })}
                                <td
                                    className="border-b border-border px-2 py-1.5 text-center font-black text-foreground bg-amber-50 dark:bg-amber-900/20 sticky right-0 z-20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/60 hover:text-amber-900 dark:hover:text-amber-200"
                                    onClick={() => onBazarClick && onBazarClick(day)}
                                >
                                    {bazarTotal > 0 ? bazarTotal : '-'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot className="sticky bottom-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                    <tr className="bg-emerald-700 text-white font-black text-xs">
                        <td className="border-r border-emerald-800 px-2 py-3 sticky left-0 z-40 bg-emerald-700">TOTAL</td>
                        {(members || []).map((member, i) => {
                            const isViolet = i % 2 === 0;
                            const footerClass = isViolet ? 'bg-violet-900/40 text-violet-100' : 'bg-blue-900/40 text-blue-100';
                            const userMeals = (meals || []).filter(m => m.user_id === member.user_id && m.month === month);
                            const total = userMeals.reduce((sum, m) => sum + m.breakfast + m.lunch + m.dinner, 0);
                            return (
                                <td key={`${member.user_id}-total`} colSpan={3} className={`border-r border-emerald-800 px-1 py-3 text-center ${footerClass}`}>
                                    {total}
                                </td>
                            );
                        })}
                        <td className="px-2 py-3 sticky right-0 z-40 bg-amber-700 text-center text-amber-50">
                            {(bazars || []).filter(b => b.status === 'approved').reduce((sum, b) => sum + b.amount, 0)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
