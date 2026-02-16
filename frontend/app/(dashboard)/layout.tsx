'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useMe } from '@/hooks/useAuth';
import { MobileNav } from '@/components/layout/MobileNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { data: user, isLoading } = useMe();

    useEffect(() => {
        if (!isLoading && !authService.isAuthenticated()) {
            router.replace('/login');
        }
    }, [isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <DesktopSidebar user={user} />
            </div>

            {/* Main Content */}
            <div className="lg:pl-64">
                <Header user={user} />
                <main className="p-4 pb-20 lg:pb-4">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="lg:hidden">
                <MobileNav />
            </div>
        </div>
    );
}
