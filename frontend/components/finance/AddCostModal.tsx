import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMessContext } from '@/contexts/MessContext';
import { financeService } from '@/services/finance.service';
import { messService } from '@/services/mess.service';
import { X, DollarSign, Users, AlertCircle, Calculator, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/formatters';

interface AddCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMonth: string;
}

type SplitType = 'equal' | 'custom';

const CATEGORIES = [
    'House Rent',
    'Electricity Bill',
    'Internet Bill',
    'Water Bill',
    'Waste Management (Moila)',
    'House Help (Bua)',
    'Gas Bill',
    'Service Charge (Lift/Security)',
    'Other'
];

export default function AddCostModal({ isOpen, onClose, currentMonth }: AddCostModalProps) {
    const { currentMessId } = useMessContext();
    const queryClient = useQueryClient();

    const [category, setCategory] = useState('');
    const [customName, setCustomName] = useState('');
    const [isOtherCategory, setIsOtherCategory] = useState(false);
    const [amount, setAmount] = useState('');
    const [splitType, setSplitType] = useState<SplitType>('equal');
    const [shares, setShares] = useState<Record<string, string>>({});

    const { data: messDetails } = useQuery({
        queryKey: ['mess-details', currentMessId],
        queryFn: () => currentMessId ? messService.getMessDetails(currentMessId) : null,
        enabled: !!currentMessId && isOpen,
    });

    const activeMembers = useMemo(() => {
        return messDetails?.members?.filter(m => m.status === 'active') || [];
    }, [messDetails]);

    const activeMemberCount = activeMembers.length;

    const createCostMutation = useMutation({
        mutationFn: financeService.addServiceCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-costs'] });
            queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
            toast.success('Service cost added successfully');
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add cost');
        }
    });

    const resetForm = () => {
        setCategory('');
        setCustomName('');
        setIsOtherCategory(false);
        setAmount('');
        setSplitType('equal');
        setShares({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setCategory(value);
        if (value === 'Other') {
            setIsOtherCategory(true);
            setCustomName('');
        } else {
            setIsOtherCategory(false);
            setCustomName(value);
        }
    };

    const handleShareChange = (userId: string, value: string) => {
        setShares(prev => ({ ...prev, [userId]: value }));
    };

    const calculateTotalShares = () => {
        return Object.values(shares).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMessId) return;

        const totalAmount = parseFloat(amount);
        const finalName = isOtherCategory ? customName : category;

        if (!finalName || isNaN(totalAmount) || totalAmount <= 0) {
            toast.error('Please enter valid details');
            return;
        }

        const costData: any = {
            mess_id: currentMessId,
            month: currentMonth,
            name: finalName,
            amount: totalAmount,
            status: 'approved',
        };

        if (splitType === 'custom') {
            const currentTotalShares = calculateTotalShares();
            if (Math.abs(currentTotalShares - totalAmount) > 0.1) {
                toast.error(`Total shares (${currentTotalShares}) must equal total amount (${totalAmount})`);
                return;
            }

            costData.shares = Object.entries(shares)
                .map(([userId, amt]) => ({
                    user_id: userId,
                    amount: parseFloat(amt) || 0
                }))
                .filter(s => s.amount > 0);
        }

        createCostMutation.mutate(costData);
    };

    // Initialize shares with equal split when switching to custom or amount changes
    useEffect(() => {
        if (splitType === 'custom' && amount && activeMemberCount > 0) {
            // Only auto-fill if shares are empty to avoid overwriting user input
            // potentially better: just default placeholder, but let's pre-fill for convenience?
            // User requested explicit custom split controls.
            // Let's NOT auto-fill to avoid confusion, or maybe generic auto-fill is helpful.
            // Existing logic didn't auto-fill, so let's leave it blank/manual as requested implicitly.
        }
    }, [splitType, amount, activeMemberCount]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card dark:bg-card rounded-3xl w-full max-w-lg shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center space-x-3">
                        <Tag className="w-6 h-6" />
                        <h2 className="text-xl font-black uppercase tracking-tight">Add Service Cost</h2>
                    </div>
                    <button onClick={handleClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Category</label>
                            <select
                                value={category}
                                onChange={handleCategoryChange}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">Select Expense Type</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {isOtherCategory && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Custom Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. WiFi Repair"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="w-full bg-background border-2 border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Total Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Split Type Toggle */}
                    <div className="bg-muted p-1.5 rounded-xl flex">
                        <button
                            type="button"
                            onClick={() => setSplitType('equal')}
                            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-2 ${splitType === 'equal' ? 'bg-indigo-600 text-white shadow-md' : 'text-muted-foreground hover:bg-background'}`}
                        >
                            <Users className="w-3 h-3" />
                            <span>Split Equally</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSplitType('custom')}
                            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-2 ${splitType === 'custom' ? 'bg-indigo-600 text-white shadow-md' : 'text-muted-foreground hover:bg-background'}`}
                        >
                            <Calculator className="w-3 h-3" />
                            <span>Custom Split</span>
                        </button>
                    </div>

                    {/* Split Details */}
                    {splitType === 'equal' ? (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 flex items-start space-x-3">
                            <InfoIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Equal Division</p>
                                <p className="text-xs text-indigo-700 dark:text-indigo-400/80">
                                    Total amount will be divided equally among {activeMemberCount} active members.
                                    Approx. <span className="font-black bg-white dark:bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-800 dark:text-indigo-300">{formatCurrency((parseFloat(amount) || 0) / (activeMemberCount || 1))}</span> per person.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Members</label>
                                <div className={`text-xs font-black px-2 py-1 rounded ${Math.abs(calculateTotalShares() - (parseFloat(amount) || 0)) < 0.1 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                                    Total: {formatCurrency(calculateTotalShares())} / {formatCurrency(parseFloat(amount) || 0)}
                                </div>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {activeMembers.map(member => (
                                    <div key={member.user_id} className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0">
                                            {(member.name || member.user_name || '?')[0]}
                                        </div>
                                        <span className="text-sm font-bold text-foreground flex-1 truncate">{member.name || member.user_name || 'Unknown'}</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={shares[member.user_id] || ''}
                                            onChange={(e) => handleShareChange(member.user_id, e.target.value)}
                                            className="w-24 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-bold text-right text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-border">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createCostMutation.isPending}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createCostMutation.isPending ? 'Adding...' : 'Add Cost'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function InfoIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}
