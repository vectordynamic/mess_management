'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, DollarSign, Users, FileText, Settings, Utensils, CreditCard } from 'lucide-react';
import { useMessContext } from '@/contexts/MessContext';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard/mess', icon: Users, label: 'Mess', hasBadge: true },
    { href: '/dashboard/finance/meals', icon: Utensils, label: 'Meals' },
    { href: '/dashboard/finance/costs', icon: DollarSign, label: 'Costs' },
    { href: '/dashboard/feed', icon: FileText, label: 'Feed' },
    { href: '/dashboard/finance', icon: CreditCard, label: 'Money' },
];

export function MobileNav() {
    const pathname = usePathname();
    const { pendingRequestsCount } = useMessContext();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-50 pb-safe shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
                {navItems.map(({ href, icon: Icon, label, hasBadge }) => {
                    const isActive = href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname === href || (pathname?.startsWith(href + '/') && !navItems.some(item => item.href !== href && item.href.startsWith(href) && pathname.startsWith(item.href)));

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {isActive && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                            )}
                            <div className="relative">
                                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                {hasBadge && pendingRequestsCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-lg animate-pulse ring-2 ring-background">
                                        {pendingRequestsCount}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[9px] sm:text-[10px] mt-1.5 font-bold uppercase tracking-tighter transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
