import { Bell } from 'lucide-react';
import type { User } from '@/types/auth';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export function Header({ user }: { user: User }) {
    return (
        <header className="bg-card shadow-sm lg:hidden border-b border-border sticky top-0 z-40">
            <div className="px-4 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-primary">আমার ডেরা</h1>
                    <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <button className="p-2 hover:bg-muted rounded-lg relative text-muted-foreground hover:text-foreground transition-colors">
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                    </button>
                </div>
            </div>
        </header>
    );
}
