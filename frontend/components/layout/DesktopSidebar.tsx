'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, DollarSign, Users, FileText, Settings, LogOut, Utensils, CreditCard } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useLogout } from '@/hooks/useAuth';
import type { User } from '@/types/auth';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/mess', icon: Users, label: 'Mess Management' },
    { href: '/dashboard/finance/meals', icon: Utensils, label: 'Meal Sheet' },
    { href: '/dashboard/finance/costs', icon: DollarSign, label: 'Service Costs' },
    { href: '/dashboard/finance', icon: CreditCard, label: 'Finance' },
    { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
    { href: '/dashboard/profile', icon: Settings, label: 'Profile' },
];

export function DesktopSidebar({ user }: { user: User }) {
    const pathname = usePathname();
    const logout = useLogout();

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-card shadow-lg z-50 border-r border-border">
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">আমার ডেরা</h1>
                        <p className="text-sm text-muted-foreground mt-1">Mess Management</p>
                    </div>
                    <ThemeToggle />
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = href === pathname ||
                            (href !== '/dashboard' && href !== '/dashboard/finance' && pathname.startsWith(href));

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-md font-bold'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="tracking-tight">{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center space-x-3 px-4 py-3 mb-2 rounded-xl bg-muted/50">
                        <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-primary font-bold border border-border shadow-sm">
                            {user.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all duration-200 group font-medium"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
