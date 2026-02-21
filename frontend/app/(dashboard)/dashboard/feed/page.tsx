'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, MapPin, Phone, User, Home, ArrowUpRight, MessageSquare, Tag, LayoutGrid } from 'lucide-react';
import { feedService, FeedPost, FeedCategory } from '@/services/feed.service';
import CreatePostModal from '@/components/feed/CreatePostModal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORIES: { value: FeedCategory | 'all'; label: string; icon: any }[] = [
    { value: 'all', label: 'Everything', icon: LayoutGrid },
    { value: 'house_rent', label: 'Rent', icon: Home },
    { value: 'buy', label: 'Buying', icon: Tag },
    { value: 'sell', label: 'Selling', icon: ArrowUpRight },
    { value: 'service', label: 'Bua/Help', icon: User },
    { value: 'help', label: 'General', icon: MessageSquare },
];

export default function FeedPage() {
    const [selectedCategory, setSelectedCategory] = useState<FeedCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data: posts, isLoading, refetch } = useQuery({
        queryKey: ['feed-posts', selectedCategory],
        queryFn: () => feedService.listPosts({ category: selectedCategory === 'all' ? undefined : selectedCategory }),
    });

    const filteredPosts = posts?.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.location.area.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Bachelor Feed</h1>
                    <p className="text-muted-foreground font-medium">Connect and help fellow bachelors in your city</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                    <Plus className="w-6 h-6" />
                    <span>Post Something</span>
                </button>
            </div>

            {/* Filters and Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 flex overflow-x-auto pb-2 space-x-2 scrollbar-hide no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border-2 ${selectedCategory === cat.value
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none'
                                : 'bg-card border-border text-muted-foreground hover:border-emerald-200'
                                }`}
                        >
                            <cat.icon className="w-4 h-4" />
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search Mirpur, Uttara, Bed..."
                        className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-bold text-foreground"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Feed List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {[1, 2, 4].map(i => (
                        <div key={i} className="bg-card border border-border rounded-3xl p-6 h-64 animate-pulse" />
                    ))}
                </div>
            ) : filteredPosts && filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed border-border">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No posts found</h3>
                    <p className="text-muted-foreground mt-2">Try changing your filters or be the first to post!</p>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => refetch()}
                />
            )}
        </div>
    );
}

function PostCard({ post }: { post: FeedPost }) {
    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

    return (
        <div className="bg-card border border-border rounded-3xl p-6 hover:shadow-xl hover:translate-y-[-4px] transition-all group flex flex-col h-full">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-lg ring-4 ring-background">
                        {(post.user_name || post.user_id)[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-foreground leading-tight">{post.user_name || 'Anonymous'}</p>
                        <p className="text-[10px] text-muted-foreground bg-muted inline-block px-1.5 py-0.5 rounded-md mt-1 font-black uppercase tracking-wider">
                            {post.mess_name || 'Personal'}
                        </p>
                    </div>
                </div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase whitespace-nowrap bg-muted px-2 py-1 rounded-full">
                    {timeAgo}
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow">
                <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                        {post.category.replace('_', ' ')}
                    </span>
                    {post.price && (
                        <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            ৳{post.price.toLocaleString()}
                        </span>
                    )}
                </div>
                <h3 className="text-lg font-black text-foreground mb-2 group-hover:text-emerald-600 transition-colors leading-tight">
                    {post.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed">
                    {post.description}
                </p>
            </div>

            {/* Footer / Location & Contact */}
            <div className="mt-auto space-y-3 pt-4 border-t border-border">
                <div className="flex items-center text-xs text-muted-foreground font-medium">
                    <MapPin className="w-4 h-4 mr-2 text-rose-500 shrink-0" />
                    <span className="truncate">{post.location.area}, {post.location.city}</span>
                </div>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(post.contact_info);
                        toast.success("Contact info copied!");
                    }}
                    className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-2xl transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 group/btn"
                >
                    <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-emerald-600" />
                        <span className="text-xs font-bold text-foreground">{post.contact_info}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}
