import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Check } from 'lucide-react';
import { ConfirmationBottomSheet } from '../components/ui/ConfirmationBottomSheet';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { useToast } from '../context/ToastContext';
import type { User } from '../lib/mockData';

const COLORS = ['#E8312A', '#2563EB', '#166534', '#6366F1', '#B45309', '#0F172A'];

const SOCIAL_PLATFORMS = [
    { id: 'instagram', name: 'Instagram' },
    { id: 'youtube', name: 'YouTube' },
    { id: 'twitter', name: 'Twitter' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'discord', name: 'Discord' }
];

const getSocialIcon = (platform: string) => {
    switch (platform) {
        case 'instagram': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-[#E1306C]"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
        case 'youtube': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-[#FF0000]"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>;
        case 'twitter': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-black"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>;
        case 'linkedin': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-[#0A66C2]"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;
        case 'tiktok': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-black"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>;
        case 'discord': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-[#5865F2]"><path d="M15 11h.01M9 11h.01M6.2 16.5A13 13 0 0 1 3 13V8.5C3 6 5.4 4 8 4h8c2.6 0 5 2 5 4.5V13c0 1.2-.5 2.5-1.2 3.5M12 21c-3.1 0-6-1.5-8-4a11.8 11.8 0 0 1-1-4M19 19l-2-2"></path></svg>;
        default: return null;
    }
}

const getSocialUrl = (platform: string, handle: string | null) => {
    if (!handle) return null;
    const clean = handle.replace('@', '').trim();
    const urls: Record<string, string> = {
        instagram: `https://instagram.com/${clean}`,
        youtube: `https://youtube.com/@${clean}`,
        twitter: `https://twitter.com/${clean}`,
        linkedin: `https://linkedin.com/in/${clean}`,
        tiktok: `https://tiktok.com/@${clean}`,
        discord: `https://discord.gg/${clean}`,
    };
    return urls[platform] || null;
};

export const EditProfileContent = ({ isDesktop }: { isDesktop?: boolean }) => {
    const { currentUser, updateProfile, logout } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState(currentUser?.name || '');
    const [username, setUsername] = useState(currentUser?.username || '');
    const [bio, setBio] = useState(currentUser?.bio || '');
    const [location, setLocation] = useState(currentUser?.location || '');
    const [website, setWebsite] = useState(currentUser?.website || '');
    const [selectedColor, setSelectedColor] = useState(currentUser?.avatarColor || COLORS[0]);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialHandles = (currentUser as any)?.socialHandles || {};
    const [socialHandles, setSocialHandles] = useState<Record<string, string>>(initialHandles);

    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    useEffect(() => {
        const changed = 
            displayName !== currentUser?.name ||
            username !== currentUser?.username ||
            bio !== currentUser?.bio ||
            location !== currentUser?.location ||
            website !== currentUser?.website ||
            selectedColor !== currentUser?.avatarColor ||
            JSON.stringify(socialHandles) !== JSON.stringify(initialHandles);
        setHasChanges(changed);
    }, [displayName, username, bio, location, website, selectedColor, socialHandles, currentUser, initialHandles]);

    const handleSave = async () => {
        if (!hasChanges) return;
        setSaving(true);
        await new Promise(r => setTimeout(r, 1000));
        await updateProfile({
            name: displayName,
            username,
            bio,
            location,
            website,
            avatarColor: selectedColor,
            socialHandles,
        } as Partial<User>);
        setSaving(false);
        setHasChanges(false);
        addToast("Profile updated.", "success");
        if (!isDesktop) navigate(-1);
    };

    const handleDelete = () => {
        setIsDeleteOpen(false);
        setTimeout(() => {
            logout();
            navigate('/');
            addToast("Account deleted.", "success");
        }, 2000);
    };

    const updateHandle = (platform: string, value: string) => {
        setSocialHandles(prev => ({ ...prev, [platform]: value }));
    };

    const usernameValid = /^[a-z0-9_]*$/.test(username);

    return (
        <div className={`w-full bg-white min-h-screen ${isDesktop ? 'rounded-[16px] border border-border shadow-sm overflow-hidden' : ''}`}>
            {/* Header */}
            <div className="h-[56px] border-b border-border flex items-center justify-between px-4 sticky top-0 bg-white/95 backdrop-blur-sm z-30">
                {!isDesktop ? (
                    <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-surfaceAlt transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                ) : <div className="w-10" />}
                <h1 className="text-[17px] font-black text-[#111] absolute left-1/2 -translate-x-1/2">Edit Profile</h1>
                <button 
                    onClick={handleSave} 
                    disabled={!hasChanges || saving || !usernameValid}
                    className={`text-[14px] font-extrabold transition-colors ${!hasChanges || saving || !usernameValid ? 'text-[#AAAAAA]' : 'text-[#E8312A]'}`}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            <div className="px-4 pb-[80px]">
                {/* Avatar Section */}
                <div className="flex flex-col items-center pt-8">
                    <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white font-black text-[28px] mb-3" style={{ backgroundColor: selectedColor }}>
                        {displayName?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <button onClick={() => setIsColorPickerOpen(true)} className="text-[13px] font-bold text-[#E8312A] hover:underline">Change avatar color &rarr;</button>
                </div>

                {/* Basic Info Section */}
                <div className="mt-6">
                    <h2 className="text-[11px] font-extrabold text-[#AAAAAA] uppercase tracking-widest mb-4">Basic Info</h2>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#555]">Display Name</label>
                            <input type="text" maxLength={50} value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full h-[52px] border-[1.5px] border-[#E8E8E8] rounded-[10px] px-4 font-semibold text-[14px] text-[#333] focus:border-[#E8312A] focus:ring-1 focus:ring-[#E8312A] outline-none transition-all" />
                            <span className="text-[11px] text-[#AAAAAA] self-end">{displayName.length} / 50</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#555]">Username</label>
                            <div className="relative">
                                <span className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#AAAAAA]">@</span>
                                <input type="text" maxLength={30} value={username} onChange={e => setUsername(e.target.value)} placeholder="username" className={`w-full h-[52px] border-[1.5px] rounded-[10px] pl-[32px] pr-4 font-semibold text-[14px] text-[#333] outline-none transition-all ${!usernameValid ? 'border-[#E8312A] animate-shake' : 'border-[#E8E8E8] focus:border-[#E8312A] focus:ring-1 focus:ring-[#E8312A]'}`} />
                            </div>
                            {!usernameValid && <span className="text-[11px] text-[#E8312A]">Only letters, numbers, and underscores allowed.</span>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#555]">Bio</label>
                            <textarea maxLength={200} placeholder="Tell followers what you create and what they can expect from your resources." value={bio} onChange={e => setBio(e.target.value)} className="w-full min-h-[88px] max-h-[160px] border-[1.5px] border-[#E8E8E8] rounded-[10px] p-4 font-semibold text-[14px] text-[#333] focus:border-[#E8312A] focus:ring-1 focus:ring-[#E8312A] outline-none resize-y transition-all" />
                            <span className="text-[11px] text-[#AAAAAA] self-end">{bio.length} / 200</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#555]">Location</label>
                            <input type="text" placeholder="City, Country" value={location} onChange={e => setLocation(e.target.value)} className="w-full h-[52px] border-[1.5px] border-[#E8E8E8] rounded-[10px] px-4 font-semibold text-[14px] text-[#333] focus:border-[#E8312A] outline-none" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#555]">Website</label>
                            <input type="url" placeholder="https://yourwebsite.com" value={website} onChange={e => setWebsite(e.target.value)} className="w-full h-[52px] border-[1.5px] border-[#E8E8E8] rounded-[10px] px-4 font-semibold text-[14px] text-[#333] focus:border-[#E8312A] outline-none" />
                        </div>
                    </div>
                </div>

                {/* Social Handles Section */}
                <div className="mt-8">
                    <h2 className="text-[11px] font-extrabold text-[#AAAAAA] uppercase tracking-widest">Social Handles</h2>
                    <p className="text-[12px] font-semibold text-[#888] mb-2">Add the accounts you want followers to find you on.</p>

                    <div className="flex flex-col">
                        {SOCIAL_PLATFORMS.map(platform => {
                            const val = socialHandles[platform.id] || '';
                            const url = getSocialUrl(platform.id, val);
                            return (
                            <div key={platform.id} className="min-h-[64px] py-3 flex items-center gap-3 border-b border-[#F4F4F4]">
                                <div className="w-[36px] h-[36px] rounded-[8px] bg-[#F6F6F6] shrink-0 flex items-center justify-center">
                                    {getSocialIcon(platform.id)}
                                </div>
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                    <span className="text-[13px] font-extrabold text-[#333] mb-1">{platform.name}</span>
                                    <input 
                                        type="text" 
                                        placeholder="@handle or paste profile URL" 
                                        value={val} 
                                        onChange={e => updateHandle(platform.id, e.target.value)} 
                                        className="w-full h-[36px] border-[1.5px] border-[#E8E8E8] rounded-[8px] px-3 font-semibold text-[13px] text-[#333] focus:border-[#E8312A] outline-none transition-colors" 
                                    />
                                </div>
                                {url && (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-[#E8312A] hover:underline whitespace-nowrap pt-[20px] pr-1">
                                        Visit &rarr;
                                    </a>
                                )}
                            </div>
                        )})}
                    </div>
                </div>

                {/* Danger Zone Section */}
                <div className="mt-8">
                    <h2 className="text-[11px] font-extrabold text-[#AAAAAA] uppercase tracking-widest mb-2">Account</h2>
                    
                    <div className="flex flex-col">
                        <div onClick={() => !isDesktop && navigateToChangePassword()} className="h-[52px] flex items-center justify-between border-b border-[#F4F4F4] cursor-pointer hover:bg-surfaceAlt">
                            <span className="text-[14px] font-bold text-[#333]">Change Password</span>
                            <span className="text-[#DDD]">›</span>
                        </div>
                        <div onClick={() => setIsDeleteOpen(true)} className="h-[52px] flex items-center justify-between cursor-pointer hover:bg-errorBg transition-colors">
                            <span className="text-[14px] font-bold text-[#E8312A]">Delete Account</span>
                            <span className="text-[#E8312A]">›</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Color Picker Bottom Sheet (simulated) */}
            {isColorPickerOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 animate-fadeIn" onClick={() => setIsColorPickerOpen(false)}>
                    <div className="bg-white rounded-t-[24px] p-6 animate-slideUp" onClick={e => e.stopPropagation()}>
                        <h3 className="text-[18px] font-black text-[#111] mb-6 text-center">Choose Avatar Color</h3>
                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => { setSelectedColor(c); setIsColorPickerOpen(false); }}
                                    className={`w-[48px] h-[48px] rounded-full flex items-center justify-center transition-transform ${selectedColor === c ? 'scale-110 ring-2 ring-offset-2 ring-[#333]' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                >
                                    {selectedColor === c && <Check size={20} className="text-white" />}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsColorPickerOpen(false)} className="w-full h-12 bg-surfaceAlt text-text font-black rounded-xl">Close</button>
                    </div>
                </div>
            )}

            <ConfirmationBottomSheet
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Account"
                description="Delete your AdGate account? This will permanently remove your profile, all links, and all analytics data. Your subscribers and followers keep their follows — this only affects AdGate."
                confirmText="Delete Account"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={handleDelete}
            />
        </div>
    );

    function navigateToChangePassword() {
        // mock logic for sub-screen
        addToast("Change Password screen mock", "info");
    }
}

export const EditProfile = () => {
    return (
        <div className="fixed inset-0 z-[100] bg-white lg:static lg:bg-transparent lg:z-0 w-full h-full overflow-y-auto lg:overflow-visible animate-slideInRight lg:animate-none">
            <div className="hidden lg:block w-full h-full">
                <DashboardLayout currentTab="account" onTabChange={() => {}}>
                    <EditProfileContent isDesktop={true} />
                </DashboardLayout>
            </div>
            <div className="block lg:hidden w-full h-full bg-white">
                <EditProfileContent isDesktop={false} />
            </div>
        </div>
    );
};
