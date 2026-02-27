'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMe } from '@/hooks/useAuth';
import { messService } from '@/services/mess.service';
import type { Role, MessMember } from '@/services/mess.service';

interface MessContextType {
    currentMessId: string | null;
    setCurrentMessId: (messId: string | null) => void;
    userRole: Role | null;
    isAdmin: boolean;
    isManager: boolean;
    isMemberOfAnyMess: boolean;
    pendingRequestsCount: number;
    refreshPendingRequests: () => Promise<void>;
    user: any; // Using any for now to avoid circular deps or complex type imports if not readily available, or use User type if imported.
}

const MessContext = createContext<MessContextType | undefined>(undefined);

export function MessProvider({ children }: { children: React.ReactNode }) {
    const [currentMessId, setCurrentMessId] = useState<string | null>(null);
    const { data: user } = useMe();
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const isMemberOfAnyMess = !!user?.messes && user.messes.length > 0;

    const refreshPendingRequests = async () => {
        if (currentMessId && isAdmin) {
            try {
                const requests = await messService.getRequests(currentMessId);
                setPendingRequestsCount(requests.length);
            } catch (error) {
                console.error('Failed to fetch pending requests count:', error);
                setPendingRequestsCount(0);
            }
        } else {
            setPendingRequestsCount(0);
        }
    };

    // Auto-select first mess if user has messes
    useEffect(() => {
        if (user?.messes && user.messes.length > 0 && !currentMessId) {
            setCurrentMessId(user.messes[0]);
        }
    }, [user, currentMessId]);

    // Fetch mess details to get the real user role
    useEffect(() => {
        async function fetchRole() {
            if (currentMessId && user) {
                try {
                    const mess = await messService.getMessDetails(currentMessId);
                    const member = mess.members.find(m => m.user_id === user.id);
                    if (member) {
                        const roles = member.roles as Role[];
                        setUserRole(roles[0] || 'member');
                        setIsAdmin(roles.includes('admin'));
                        setIsManager(roles.includes('manager'));
                    } else {
                        setUserRole('member');
                        setIsAdmin(false);
                        setIsManager(false);
                    }
                } catch (error) {
                    console.error('Failed to fetch mess role:', error);
                    setUserRole('member');
                    setIsAdmin(false);
                    setIsManager(false);
                }
            } else {
                setUserRole(null);
                setIsAdmin(false);
                setIsManager(false);
            }
        }
        fetchRole();
    }, [currentMessId, user?.messes, user?.id]);

    // Fetch pending requests count when mess or admin status changes
    useEffect(() => {
        refreshPendingRequests();
    }, [currentMessId, isAdmin]);

    return (
        <MessContext.Provider
            value={{
                currentMessId,
                setCurrentMessId,
                userRole,
                isAdmin,
                isManager,
                isMemberOfAnyMess,
                pendingRequestsCount,
                refreshPendingRequests,
                user,
            }}
        >
            {children}
        </MessContext.Provider>
    );
}

export function useMessContext() {
    const context = useContext(MessContext);
    if (context === undefined) {
        throw new Error('useMessContext must be used within a MessProvider');
    }
    return context;
}
