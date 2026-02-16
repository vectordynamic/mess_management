'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-accent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring active:scale-95"
            aria-label="Toggle theme"
        >
            <div className="relative w-[1.2rem] h-[1.2rem]">
                <Sun className="absolute top-0 left-0 w-full h-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute top-0 left-0 w-full h-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
        </button>
    );
}
