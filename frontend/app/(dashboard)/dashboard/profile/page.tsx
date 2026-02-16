'use client';

import { useMe } from '@/hooks/useAuth';
import { User as UserIcon, Phone, Users, Shield, Crown, ChefHat } from 'lucide-react';
import { useState, useEffect } from 'react';
import { messService } from '@/services/mess.service';
import type { Role, Mess } from '@/services/mess.service';

const roleConfig: Record<Role, { label: string; icon: any; color: string; bgColor: string }> = {
    admin: { label: 'Admin', icon: Crown, color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    manager: { label: 'Manager', icon: Shield, color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    meal_manager: { label: 'Meal Manager', icon: ChefHat, color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    member: { label: 'Member', icon: Users, color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800' },
};

export default function ProfilePage() {
    const { data: user } = useMe();
    const [messesData, setMessesData] = useState<Mess[]>([]);
    const [isLoadingMesses, setIsLoadingMesses] = useState(false);

    useEffect(() => {
        async function fetchMesses() {
            if (user?.messes?.length) {
                setIsLoadingMesses(true);
                try {
                    const data = await Promise.all(
                        user.messes.map(id => messService.getMessDetails(id))
                    );
                    setMessesData(data);
                } catch (error) {
                    console.error('Failed to fetch messes for profile:', error);
                } finally {
                    setIsLoadingMesses(false);
                }
            }
        }
        fetchMesses();
    }, [user]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const userMesses = messesData.map((mess) => {
        const member = mess.members.find(m => m.user_id === user.id);
        return {
            id: mess.id,
            name: mess.name,
            roles: member?.roles || (['member'] as Role[]),
        };
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your account information</p>
            </div>

            {/* Profile Card */}
            <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-32"></div>

                <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="flex items-end -mt-16 mb-6">
                        <div className="w-32 h-32 bg-card rounded-full border-4 border-card shadow-xl flex items-center justify-center">
                            <span className="text-4xl font-bold text-primary">{user.name[0]}</span>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">Member ID: {user.id}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone Number</p>
                                    <p className="font-semibold text-foreground">{user.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Messes</p>
                                    <p className="font-semibold text-foreground">{user.messes?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mess Memberships with Roles */}
            {userMesses.length > 0 && (
                <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Your Messes & Roles</h3>
                    <div className="space-y-4">
                        {userMesses.map((mess) => (
                            <div key={mess.id} className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-foreground mb-2">{mess.name}</h4>
                                        <p className="text-sm text-muted-foreground mb-3">ID: {mess.id}</p>

                                        {/* Role Badges */}
                                        <div className="flex flex-wrap gap-2">
                                            {mess.roles.map((role) => {
                                                const config = roleConfig[role];
                                                const Icon = config.icon;
                                                return (
                                                    <div
                                                        key={role}
                                                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${config.bgColor}`}
                                                    >
                                                        <Icon className={`w-4 h-4 ${config.color}`} />
                                                        <span className={`text-sm font-medium ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Note:</strong> You can have multiple roles in a mess. For example, you can be both an Admin and a Meal Manager.
                        </p>
                    </div>
                </div>
            )}

            {/* Settings Section */}
            <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Account Settings</h3>
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Account settings coming soon</p>
                </div>
            </div>
        </div>
    );
}
