'use client';

import { useMe } from '@/hooks/useAuth';
import { Plus, Users, DollarSign, Utensils, Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMessContext } from '@/contexts/MessContext';

export default function DashboardPage() {
    const { data: user } = useMe();
    const { pendingRequestsCount, isAdmin, currentMessId } = useMessContext();

    const stats = [
        { label: 'Active Messes', value: user?.messes?.length || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: 'This Month', value: '৳0', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Meals Today', value: '0', icon: Utensils, color: 'bg-orange-50 text-orange-600' },
    ];

    const quickActions = [
        { label: 'Create Mess', href: '/dashboard/mess/create', icon: Plus, color: 'bg-emerald-600' },
        { label: 'Join Mess', href: '/dashboard/mess/join', icon: Users, color: 'bg-blue-600' },
        { label: 'Add Meal', href: '/dashboard/finance/meals', icon: Utensils, color: 'bg-orange-600' },
        { label: 'Add Bazar', href: '/dashboard/finance/bazar', icon: DollarSign, color: 'bg-purple-600' },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                <div className="relative z-10">
                    <h2 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">Welcome back, {user?.name}!</h2>
                    <p className="opacity-90 font-medium">Manage your mess finances and track meals easily</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>
            </div>

            {/* Pending Requests Alert */}
            {isAdmin && pendingRequestsCount > 0 && (
                <Link
                    href={`/dashboard/mess/${currentMessId}`}
                    className="group flex items-center justify-between p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-none animate-bounce-slow">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-rose-900 dark:text-rose-200 font-black text-lg">Pending Join Requests</h4>
                            <p className="text-rose-700/70 dark:text-rose-400 text-sm font-medium">
                                There are <span className="font-black  scale-110 px-1 inline-block">{pendingRequestsCount}</span> members waiting to join your mess
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-sm bg-white dark:bg-rose-900/40 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800 shadow-sm transition-transform group-hover:translate-x-2 relative z-10">
                        <span>Review Now</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </Link>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                stat.color.includes('emerald') ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                    'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                }`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-border hover:bg-muted/50"
                        >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${action.color === 'bg-emerald-600' ? 'bg-emerald-600 text-white' :
                                action.color === 'bg-blue-600' ? 'bg-blue-600 text-white' :
                                    action.color === 'bg-orange-600' ? 'bg-orange-600 text-white' :
                                        'bg-purple-600 text-white'
                                }`}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <p className="font-medium text-foreground">{action.label}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Your mess activities will appear here</p>
                </div>
            </div>
        </div>
    );
}
