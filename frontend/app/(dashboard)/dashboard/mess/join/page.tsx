'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messService } from '@/services/mess.service';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function JoinMessPage() {
    const { register, handleSubmit, formState: { errors } } = useForm<{ messId: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const joinMutation = useMutation({
        mutationFn: (messId: string) => messService.joinMess(messId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success('Join request sent successfully!');
            router.push('/dashboard');
        },
    });

    const onSubmit = async (data: { messId: string }) => {
        try {
            await joinMutation.mutateAsync(data.messId);
        } catch (err: any) {
            toast.error(err.message || 'Failed to join mess');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link href="/dashboard" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>

            <div className="bg-card rounded-2xl shadow-sm p-6 md:p-8 border border-border">
                <h1 className="text-2xl font-bold text-foreground mb-2">Join Existing Mess</h1>
                <p className="text-muted-foreground mb-6">Enter the mess ID to send a join request</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="messId" className="block text-sm font-medium text-muted-foreground mb-2">
                            Mess ID
                        </label>
                        <input
                            {...register('messId', { required: 'Mess ID is required' })}
                            type="text"
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none uppercase text-foreground placeholder:text-muted-foreground/50"
                            placeholder="e.g., MESS-1234"
                        />
                        {errors.messId && <p className="mt-1 text-sm text-red-600">{errors.messId.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={joinMutation.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                        {joinMutation.isPending ? 'Sending Request...' : 'Send Join Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}
