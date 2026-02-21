'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, DollarSign, Users, FileText, Settings, Utensils, CreditCard } from 'lucide-react';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard/finance/meals', icon: Utensils, label: 'Meals' },
    { href: '/dashboard/finance/costs', icon: DollarSign, label: 'Service Costs' },
    { href: '/dashboard/finance', icon: CreditCard, label: 'Finance' },
    { href: '/dashboard/feed', icon: FileText, label: 'Feed' },
    { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname === href || (pathname?.startsWith(href + '/') && !navItems.some(item => item.href !== href && item.href.startsWith(href) && pathname.startsWith(item.href)));

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'scale-110 transition-transform' : ''}`} />
                            <span className="text-[10px] mt-1 font-medium">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
