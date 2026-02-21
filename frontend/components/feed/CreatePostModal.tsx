'use client';

import { useState } from 'react';
import { X, Send, MapPin, Phone, Tag, DollarSign, Loader2, Search } from 'lucide-react';
import { feedService, FeedCategory } from '@/services/feed.service';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES: { value: FeedCategory; label: string; icon: string }[] = [
    { value: 'house_rent', label: 'House Rent', icon: '🏠' },
    { value: 'buy', label: 'Buy Product', icon: '🛒' },
    { value: 'sell', label: 'Sell Product', icon: '💰' },
    { value: 'service', label: 'Service (Bua/Khala)', icon: '👩‍🍳' },
    { value: 'help', label: 'Help/General', icon: '💡' },
];

const CITIES = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'];

export default function CreatePostModal({ onClose, onSuccess }: CreatePostModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        category: 'house_rent' as FeedCategory,
        title: '',
        description: '',
        city: 'Dhaka',
        area: '',
        address: '',
        contact_info: '',
        price: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await feedService.createPost({
                category: formData.category,
                title: formData.title,
                description: formData.description,
                location: {
                    city: formData.city,
                    area: formData.area,
                    address: formData.address,
                },
                contact_info: formData.contact_info,
                price: formData.price ? parseFloat(formData.price) : undefined,
            });

            toast.success('Post created successfully!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-card z-10 p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-foreground">Create New Post</h2>
                        <p className="text-sm text-muted-foreground mt-1">Share what you need or offer with other bachelors</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Category Selection */}
                    <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 block">Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.value })}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${formData.category === cat.value
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-muted/30 border-transparent text-muted-foreground hover:border-emerald-200'
                                        }`}
                                >
                                    <span className="text-2xl mb-1">{cat.icon}</span>
                                    <span className="text-[10px] font-bold text-center leading-tight uppercase">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">Post Title</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g., Seat available in Mirpur 10"
                                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">Price/Rent (Optional)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="number"
                                        placeholder="Amount in BDT"
                                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">City</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors pointer-events-none z-10">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <select
                                            className="w-full pl-10 pr-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold text-foreground"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        >
                                            {CITIES.map(city => <option key={city} value={city} className="bg-card text-foreground">{city}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <div className="w-2 h-2 border-r-2 border-b-2 border-muted-foreground rotate-45" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">Area</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors pointer-events-none z-10">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g., Mirpur 10"
                                            className="w-full pl-10 pr-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-bold text-foreground"
                                            value={formData.area}
                                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">Street Address/Details</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors pointer-events-none z-10">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g., Road 4, House 12"
                                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border-2 border-border rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-bold text-foreground"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">Full Description</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Provide details about what you're looking for or offering..."
                            className="w-full p-4 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Contact Info */}
                    <div>
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 block">Contact Information</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                            <input
                                required
                                type="text"
                                placeholder="Phone number or how to reach you"
                                className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={formData.contact_info}
                                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 italic px-2">
                            ⚠️ Note: This information will be visible to all logged-in users on the feed.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-muted text-foreground rounded-2xl font-black text-sm hover:bg-muted/80 transition-all uppercase"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all uppercase flex items-center justify-center space-x-2 shadow-lg shadow-emerald-200 dark:shadow-none disabled:bg-emerald-400"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Publish Post</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
