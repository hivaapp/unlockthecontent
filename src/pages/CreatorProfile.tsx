import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { Globe, ChevronLeft } from 'lucide-react';
import { socialIcons } from '../assets/socialIcons';
import { useMessaging } from '../context/MessagingContext';
import { useToast } from '../context/ToastContext';
import { BottomSheet } from '../components/ui/BottomSheet';
import { AuthBottomSheet } from '../components/AuthBottomSheet';
import { getCreatorProfile } from '../services/profileService';
import { TrustScoreBadge } from '../components/shared/TrustScoreBadge';

const getFileEmoji = (type: string) => {
    const t = type?.toUpperCase();
    switch (t) {
        case 'ZIP': 
        case 'ARCHIVE': return '📦';
        case 'PDF': return '📄';
        case 'DOC': 
        case 'DOCUMENT': return '📝';
        case 'IMAGES': 
        case 'IMAGE': return '🖼️';
        case 'VIDEO': 
        case 'MP4': return '🎥';
        case 'SPREADSHEET': return '📊';
        case 'LINK': return '🔗';
        default: return '📁';
    }
};

const CreatorNotFound = ({ username }: { username?: string }) => {
    const navigate = useNavigate();
    return (
        <div className="w-full min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="text-[48px] mb-4">🔍</div>
            <h1 className="text-[20px] font-[900] text-[#111] mb-2 leading-tight">Creator not found</h1>
            <p className="text-[14px] text-[#888] mb-8 font-semibold">@{username} does not exist on UnlockTheContent.</p>
            <button onClick={() => navigate('/explore')} className="px-6 h-[44px] border-[1.5px] border-[#E8312A] text-[#E8312A] font-black text-[14px] rounded-[10px] hover:bg-[#FAF0EB] transition-colors">
                Go to Explore &rarr;
            </button>
        </div>
    );
};

export const CreatorProfile = () => {
    const { handle } = useParams();
    const username = handle?.startsWith('@') ? handle.slice(1) : handle;
    const navigate = useNavigate();
    const { currentUser, isLoggedIn } = useAuth();
    const { showToast } = useToast();
    
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'resources' | 'pairing'>('resources');
    const [showMessageSheet, setShowMessageSheet] = useState(false);
    const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);

    let sendRequest: any = null;
    let hasPendingRequestTo: any = null;
    let conversations: any[] = [];
    try {
        const msgCtx = useMessaging();
        sendRequest = msgCtx?.sendRequest;
        hasPendingRequestTo = msgCtx?.hasPendingRequestTo;
        conversations = msgCtx?.conversations || [];
    } catch { /* ignore */ }

    // Fetch Profile
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const data = await getCreatorProfile(username);
                setProfile(data);
            } catch (error) {
                console.error('Error fetching creator profile:', error);
                setProfile(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (username) fetchProfile();
    }, [username]);

    // Check if viewing own profile
    const isOwner = isLoggedIn && currentUser?.username === username;
    
    if (!isLoading && !profile) {
        return <CreatorNotFound username={username} />;
    }

    const { 
        name = username, 
        bio = '', 
        avatarColor = '', 
        initial = '?',
        website = '',
        location = '',
        joinedDate = '',
        isVerified = false,
        trustScore = 75,
        socialHandles = {},
        stats = { totalLinks: 0, totalUnlocks: 0, totalFollowerPairingCampaigns: 0, totalPairsFormed: 0, treesPlanted: 0 },
        links = []
    } = profile || {};

    const allLinks = links || [];
    const resources = allLinks.filter((l: any) => l.mode !== 'follower_pairing');
    const campaigns = allLinks.filter((l: any) => l.mode === 'follower_pairing');

    const requestAlreadySent = isLoggedIn && currentUser && profile && hasPendingRequestTo ? hasPendingRequestTo(currentUser.id, profile.id) : false;
    const requestReceived = isLoggedIn && currentUser && profile && hasPendingRequestTo ? hasPendingRequestTo(profile.id, currentUser.id) : false;
    const existingConversation = conversations?.find(c => c.participants.some((p: any) => p.id === profile?.id));

    let msgBtnText = 'Message';
    let msgBtnAction = () => { if (isLoggedIn) setShowMessageSheet(true); else setIsAuthSheetOpen(true); };
    let msgBtnStyle = 'bg-brand text-white hover:bg-brandHover shadow-sm';

    if (existingConversation) {
        msgBtnText = 'Message';
        msgBtnAction = () => navigate(`/chats/${existingConversation.conversationId}`);
        msgBtnStyle = 'bg-[#FAF0EB] text-[#E8312A] border border-[#FECACA]';
    } else if (requestAlreadySent) {
        msgBtnText = 'Request Pending';
        msgBtnAction = () => navigate('/chats');
        msgBtnStyle = 'bg-surfaceAlt text-textMid border border-border';
    } else if (requestReceived) {
        msgBtnText = 'Respond to Request';
        msgBtnAction = () => navigate('/chats');
        msgBtnStyle = 'bg-[#FAF0EB] text-[#E8312A] border border-[#FECACA]';
    }


    const handleSendMessage = async () => {
        if (!isLoggedIn) {
            setIsAuthSheetOpen(true);
            return;
        }
        if (!messageText.trim() || !currentUser || !profile || !sendRequest) return;

        if (messageText.trim().length < 10) {
            showToast('Message must be at least 10 characters.', 'error');
            return;
        }
        
        if (messageText.trim().length > 500) {
            showToast('Message cannot exceed 500 characters.', 'error');
            return;
        }

        setIsSending(true);
        
        try {
            await sendRequest(profile.id, messageText, {
                id: currentUser.id,
                name: currentUser.name,
                username: currentUser.username,
                initial: currentUser.initial || 'U',
                avatarColor: currentUser.avatarColor || '#2563EB',
                trustScore: currentUser.trustScore || 85,
                isCreator: currentUser.isCreator || false,
                joinedDate: currentUser.joinedDate || new Date().toISOString()
            });
            showToast('Message request sent!', 'success');
            setShowMessageSheet(false);
            setMessageText('');
        } catch (err) {
            console.error(err);
            showToast('Failed to send message.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    // Parse date safely
    const parseJoinedDate = (d?: string) => {
        if (!d) return 'Member';
        const date = new Date(d);
        if (isNaN(date.getTime())) return 'Member';
        return `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    };

    const hasSocials = Object.values(socialHandles).some(val => !!val);



    const getSocialUrl = (platform: string, handle: string | null) => {
        if (!handle) return null;
        const clean = handle.replace('@', '').trim();
        const urls: Record<string, string> = {
            instagram: `https://instagram.com/${clean}`,
            youtube: `https://youtube.com/@${clean}`,
            twitter: `https://twitter.com/${clean}`,
            threads: `https://threads.net/@${clean}`,
            linkedin: `https://linkedin.com/in/${clean}`,
            tiktok: `https://tiktok.com/@${clean}`,
            discord: `https://discord.gg/${clean}`,
            telegram: `https://t.me/${clean}`,
            twitch: `https://twitch.tv/${clean}`,
        };
        return urls[platform] || null;
    };

    const platformIcons: Record<string, React.ReactNode> = {
        instagram: <img src={socialIcons.instagram} className="w-4 h-4 object-contain" alt="" />,
        youtube: <img src={socialIcons.youtube} className="w-4 h-4 object-contain" alt="" />,
        twitter: <img src={socialIcons.twitter} className="w-4 h-4 object-contain" alt="" />,
        threads: <img src={socialIcons.threads} className="w-4 h-4 object-contain" alt="" />,
        linkedin: <img src={socialIcons.linkedin} className="w-4 h-4 object-contain" alt="" />,
        tiktok: <img src={socialIcons.tiktok} className="w-4 h-4 object-contain" alt="" />,
        twitch: <img src={socialIcons.twitch} className="w-4 h-4 object-contain" alt="" />,
        discord: <img src={socialIcons.discord} className="w-4 h-4 object-contain" alt="" />,
        telegram: <img src={socialIcons.telegram} className="w-4 h-4 object-contain" alt="" />,
    };

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[#FAF9F7] flex flex-col items-center pt-20 px-6">
                <div className="w-24 h-24 rounded-full bg-border/40 animate-pulse mb-6" />
                <div className="h-6 w-48 bg-border/40 animate-pulse rounded mb-3" />
                <div className="h-4 w-32 bg-border/40 animate-pulse rounded mb-8" />
                <div className="w-full max-w-[600px] h-32 bg-border/20 animate-pulse rounded-[14px]" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#FAF9F7] animate-fadeIn pb-20">
            {/* Desktop Wrapper */}
            <div className="creator-profile-layout lg:flex lg:max-w-[1140px] lg:mx-auto lg:px-[48px] lg:gap-0 lg:pt-8 w-full max-w-[800px] mx-auto relative">
                
                {/* Fixed Top Nav (Standard Navbar space) - only visible on mobile really */}
                <div className="h-[64px] lg:hidden flex items-center px-[24px]">
                    <button onClick={() => navigate(-1)} className="w-[40px] h-[40px] flex items-center justify-center bg-white border border-[#E8E8E8] rounded-full hover:bg-surfaceAlt transition-colors -ml-[8px]">
                        <ChevronLeft size={20} className="text-[#111]" />
                    </button>
                </div>

                {/* Left Sidebar (Desktop) / Hero Section (Mobile) */}
                <div className="creator-profile-sidebar lg:flex-none lg:w-[260px] lg:sticky lg:top-[80px] lg:self-start lg:pr-[40px] lg:border-r lg:border-[#F0F0F0] w-full bg-white lg:bg-transparent pt-0 pb-0 relative">
                    
                    <button onClick={() => navigate(-1)} className="hidden lg:flex w-[36px] h-[36px] items-center justify-center bg-white border border-[#E8E8E8] rounded-full hover:bg-surfaceAlt transition-colors absolute -top-[48px] -left-[18px]">
                        <ChevronLeft size={18} className="text-[#111]" />
                    </button>
                    
                    {/* Own Profile Banner */}
                    {isOwner && (
                        <div className="w-full h-[40px] bg-[#FFF0EF] border-b border-[#FECACA] flex items-center justify-between px-4 lg:rounded-[8px] lg:mb-4 lg:border">
                            <span className="text-[13px] font-bold text-[#E8312A]">✏️ This is your profile.</span>
                            <button onClick={() => navigate('/profile/edit')} className="text-[13px] font-bold text-[#E8312A] underline hover:no-underline">Edit Profile &rarr;</button>
                        </div>
                    )}

                    <div className="px-[24px] lg:px-0 pt-[32px] lg:pt-0">
                        <div className="flex flex-row lg:flex-col items-end lg:items-start gap-4">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-[80px] h-[80px] lg:w-[96px] lg:h-[96px] rounded-full flex items-center justify-center text-white font-[900] text-[28px] lg:text-[36px]" style={{ backgroundColor: avatarColor || '#E8312A' }}>
                                    {initial || name?.[0]?.toUpperCase() || 'C'}
                                </div>
                                {isVerified && (
                                    <div className="absolute bottom-0 right-0 w-[22px] h-[22px] bg-blue-500 text-white rounded-full border-[2px] border-white flex items-center justify-center shadow-sm">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex flex-col flex-1 pb-1">
                                <div className="flex items-start justify-between">
                                    <h1 className="text-[22px] font-[900] text-[#111] leading-tight flex-1">{name}</h1>
                                    {isOwner && (
                                        <button onClick={() => navigate('/profile/edit')} className="hidden lg:flex px-[12px] h-[36px] items-center justify-center border border-[#DDDDDD] rounded-[10px] text-[13px] font-bold text-[#555] hover:bg-[#F9F9F9] transition-colors ml-2 shrink-0">
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                                <span className="text-[14px] font-[600] text-[#AAAAAA] mt-0.5">@{username}</span>
                                {/* Trust Score Badge — only show for non-owner profiles with score >= 75 */}
                                {!isOwner && trustScore >= 75 && (
                                    <div className="mt-1.5">
                                        <TrustScoreBadge score={trustScore} size="md" />
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5 mt-1.5">
                                    {location && <span className="text-[12px] font-[600] text-[#AAAAAA]">📍 {location}</span>}
                                    <span className="text-[11px] font-[600] text-[#BBBBBB]">{parseJoinedDate(joinedDate)}</span>
                                </div>
                            </div>

                            {/* Mobile Edit Button (only visible if owner & >= 1024px it's above) */}
                            {isOwner && (
                                <button onClick={() => navigate('/profile/edit')} className="lg:hidden h-[36px] px-[12px] border border-[#DDDDDD] rounded-[10px] text-[13px] font-bold text-[#555] flex items-center shrink-0 mb-1 ml-auto self-start mt-[-2px]">
                                    Edit
                                </button>
                            )}
                            
                            {!isOwner && (
                                <button 
                                    onClick={msgBtnAction}
                                    className={`lg:hidden h-[36px] px-[16px] rounded-[10px] text-[13px] font-bold flex items-center justify-center shrink-0 mb-1 ml-auto self-start mt-[-2px] transition-colors ${msgBtnStyle}`}
                                >
                                    {msgBtnText}
                                </button>
                            )}
                        </div>

                        {/* Desktop Message Button */}
                        {!isOwner && (
                            <button
                                onClick={msgBtnAction}
                                className={`hidden lg:flex w-full mt-4 h-[44px] rounded-[12px] text-[14px] font-[900] items-center justify-center transition-colors ${msgBtnStyle}`}
                            >
                                {msgBtnText}
                            </button>
                        )}

                        {/* Bio */}
                        {bio ? (
                            <p className="text-[14px] font-[600] text-[#555] leading-[1.75] max-w-[560px] mt-4 lg:mb-4 lg:w-full">
                                {bio}
                            </p>
                        ) : isOwner ? (
                            <div onClick={() => navigate('/profile/edit')} className="w-full border-[1.5px] border-dashed border-[#E8E8E8] rounded-[10px] p-[12px_16px] mt-4 cursor-pointer hover:bg-surfaceAlt">
                                <span className="text-[13px] text-[#AAAAAA] font-bold">Add a bio so followers know what you create. &rarr;</span>
                            </div>
                        ) : null}

                        {/* Website */}
                        {website && (
                            <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-2 lg:-mt-1 hover:opacity-80 transition-opacity w-fit">
                                <Globe size={14} className="text-[#AAAAAA]" />
                                <span className="text-[13px] font-bold text-[#E8312A] truncate max-w-[200px]">{website.replace(/^https?:\/\//,'')}</span>
                            </a>
                        )}

                        <div className="flex flex-row lg:flex-col flex-wrap gap-[10px] mt-[16px]">
                            {['instagram', 'youtube', 'twitter', 'threads', 'linkedin', 'tiktok', 'twitch', 'discord', 'telegram'].map(p => {
                                const h = (socialHandles as Record<string, string>)[p];
                                if (!h) return null;
                                return (
                                    <a key={p} href={getSocialUrl(p, h) || '#'} target="_blank" rel="noopener noreferrer" className="h-[34px] bg-white border-[1.5px] border-[#E8E8E8] rounded-[20px] px-[14px] flex items-center gap-[8px] hover:border-brand/30 transition-colors w-max lg:w-full lg:rounded-[10px]">
                                        <span>{platformIcons[p]}</span>
                                        <span className="text-[12px] font-bold text-[#333] truncate">@{h.replace('@','')}</span>
                                    </a>
                                );
                            })}
                            {!hasSocials && isOwner && (
                                <button onClick={() => navigate('/profile/edit')} className="h-[34px] border-[1.5px] border-dashed border-[#E8E8E8] rounded-[20px] px-[14px] flex items-center text-[12px] font-bold text-[#AAAAAA] hover:bg-surfaceAlt">
                                    Add social links &rarr;
                                </button>
                            )}
                        </div>

                        {/* Stats Strip */}
                        <div className="flex flex-row lg:flex-col lg:items-start lg:gap-4 justify-between border-t border-[#F4F4F4] border-b lg:border-none lg:pt-6 lg:mt-6 mt-5 py-4 lg:py-0 w-full">
                            
                            {[
                                { label: 'Links', value: stats.totalLinks },
                                { label: 'Unlocks', value: stats.totalUnlocks },
                                { label: 'Pairs', value: stats.totalPairsFormed },
                                { label: 'Campaigns', value: stats.totalFollowerPairingCampaigns },
                            ].map((s, i) => (
                                <div key={s.label} className="flex relative items-center justify-center lg:justify-start w-full">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3 items-center w-full lg:w-max">
                                        <span className="text-[18px] font-[900] text-[#111] leading-none mb-1 lg:mb-0 lg:w-[40px]">{s.value}</span>
                                        <span className="text-[11px] lg:text-[13px] font-[600] text-[#AAAAAA] uppercase tracking-wide">{s.label}</span>
                                    </div>
                                    {i < 3 && <div className="absolute right-0 top-1 bottom-1 w-[1px] bg-[#F0F0F0] lg:hidden" />}
                                </div>
                            ))}

                            <div className="flex relative items-center justify-center lg:justify-start w-full pt-0">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3 items-center w-full lg:w-max">
                                    <span className={`text-[18px] font-[900] leading-none mb-1 lg:mb-0 lg:w-[40px] ${stats.treesPlanted > 0 ? 'text-[#166534]' : 'text-[#111]'}`}>{stats.treesPlanted}</span>
                                    <span className="text-[11px] lg:text-[13px] font-[600] text-[#AAAAAA] uppercase tracking-wide flex items-center gap-1">🌱 Trees</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Column / Main Tab Section */}
                <div className="creator-profile-main lg:flex-1 lg:pl-[40px] w-full">
                    {/* Tab Bar */}
                    <div className="creator-profile-tabs sticky top-[64px] lg:top-0 bg-white border-b-[2px] border-[#F0F0F0] h-[48px] z-30 flex mb-5 lg:mb-6">
                        <button 
                            onClick={() => setActiveTab('resources')} 
                            className={`flex-1 h-full flex items-center justify-center text-[14px] font-[800] relative transition-colors ${activeTab === 'resources' ? 'text-[#111]' : 'text-[#AAAAAA] hover:text-[#555]'}`}
                        >
                            Resources
                            {activeTab === 'resources' && <div className="absolute bottom-[-2px] left-[20%] right-[20%] h-[2px] bg-[#E8312A] transition-all" />}
                        </button>

                        <button 
                            onClick={() => setActiveTab('pairing')} 
                            className={`flex-1 h-full flex items-center justify-center text-[14px] font-[800] relative transition-colors ${activeTab === 'pairing' ? 'text-[#111]' : 'text-[#AAAAAA] hover:text-[#555]'}`}
                        >
                            Pairing Campaigns
                            {campaigns.length > 0 && (
                                <div className="ml-2 bg-[#B45309] text-white w-[16px] h-[16px] rounded-full flex items-center justify-center text-[10px] font-black pointer-events-none">
                                    {campaigns.length}
                                </div>
                            )}
                            {activeTab === 'pairing' && <div className="absolute bottom-[-2px] left-[20%] right-[20%] h-[2px] bg-[#E8312A] transition-all" />}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-[16px] lg:px-0">
                        {activeTab === 'resources' && (
                            <div className="w-full flex flex-col gap-[12px] lg:grid lg:grid-cols-2 lg:gap-[16px]">
                                {resources.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center col-span-2 text-center">
                                        <div className="text-[40px] mb-4">📦</div>
                                        <h3 className="text-[18px] font-[900] text-[#111] mb-1">No resources yet.</h3>
                                        {isOwner ? (
                                            <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 h-[40px] bg-[#E8312A] text-white font-black text-[13px] rounded-[10px]">Create your first link &rarr;</button>
                                        ) : (
                                            <p className="text-[13px] text-[#888] font-semibold mt-1">Check back later.</p>
                                        )}
                                    </div>
                                ) : (
                                    resources.map((r: any) => {
                                        const ut = r.unlock_type || r.unlockType || 'custom_sponsor';
                                        let bgClass = '';
                                        let badgeColor = '';
                                        let typeColor = '';
                                        let utText = '';
                                        let badgeText = '';

                                        if (ut === 'custom_sponsor') {
                                            bgClass = 'bg-[#FAF0EB]'; typeColor = '#C1644A'; badgeColor = 'bg-white text-[#C1644A] border-[#E6E2D9]'; utText = 'Unlock via Sponsor'; badgeText = '✨ Sponsored';
                                        } else if (ut === 'email_subscribe') {
                                            bgClass = 'bg-[#EBF5EE]'; typeColor = '#417A55'; badgeColor = 'bg-white text-[#417A55] border-[#E6E2D9]'; utText = 'Subscribe to Unlock'; badgeText = '✉️ Email';
                                        } else if (ut === 'social_follow') {
                                            bgClass = 'bg-[#EFF6FF]'; typeColor = '#2563EB'; badgeColor = 'bg-white text-[#2563EB] border-[#E6E2D9]'; utText = 'Follow to Unlock'; badgeText = '📱 Social';
                                        } else if (ut === 'premium_media') {
                                            bgClass = 'bg-[#21201C]'; typeColor = '#FFFFFF'; badgeColor = 'bg-white/20 text-white border-white/20 backdrop-blur-sm'; utText = 'Watch to Unlock'; badgeText = '🎬 Premium';
                                        } else {
                                            bgClass = 'bg-[#F3F1EC]'; typeColor = '#6B6860'; badgeColor = 'bg-white text-[#6B6860] border-[#E6E2D9]'; utText = 'Unlock to View'; badgeText = '🆓 Free';
                                        }

                                        return (
                                            <Link key={r.id} to={`/r/${r.slug}`} className="w-full bg-white border border-[#E6E2D9] rounded-lg overflow-hidden group hover:border-[#D97757]/30 transition-all block translate-y-0 hover:-translate-y-0.5">
                                                <div className={`h-[80px] w-full ${bgClass} relative flex flex-col justify-end p-4 transition-colors`}>
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] text-[48px] overflow-hidden pointer-events-none group-hover:scale-110 transition-transform duration-700">{getFileEmoji(r.file?.file_type || r.fileType || 'file')}</div>
                                            <div className="relative z-10 flex items-center gap-2">
                                                        <span className="text-[18px] leading-none opacity-80">{getFileEmoji(r.file?.file_type || r.fileType || 'file')}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{r.file?.file_type || r.fileType || 'Resource'}</span>
                                                    </div>
                                                    <div className={`absolute top-3 right-3 h-[20px] px-2 border rounded-full text-[9px] font-black z-10 flex items-center gap-1 uppercase tracking-widest ${badgeColor}`}>
                                                        {badgeText}
                                                    </div>
                                                </div>
                                                <div className="p-4 flex flex-col">
                                                    <h3 className="text-[14px] font-bold text-[#21201C] leading-snug h-10 overflow-hidden line-clamp-2">{r.title}</h3>
                                                    <span className="text-[11px] font-semibold text-[#6B6860] mt-1.5 flex items-center gap-1.5">
                                                        <span>{r.viewCount || r.view_count || 0} views</span>
                                                        <span className="w-1 h-1 rounded-full bg-[#E6E2D9]" />
                                                        <span>{r.unlockCount || r.unlock_count || 0} unlocks</span>
                                                    </span>
                                                    
                                                    <div className="w-full h-10 mt-4 rounded-md text-[13px] font-black flex items-center justify-center transition-all group-hover:scale-[1.01]" style={{ backgroundColor: ut === 'premium_media' ? '#21201C' : typeColor, color: ut === 'premium_media' ? '#FFFFFF' : '#FFFFFF' }}>
                                                        {utText}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'pairing' && (
                            <div className="w-full flex flex-col gap-[12px] lg:grid lg:grid-cols-2 lg:gap-[16px]">
                                {campaigns.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center col-span-2 text-center">
                                        <div className="text-[40px] mb-4">🤝</div>
                                        <h3 className="text-[18px] font-[900] text-[#111] mb-1">No pairing campaigns yet.</h3>
                                        {isOwner && (
                                            <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 h-[40px] bg-[#B45309] text-white font-black text-[13px] rounded-[10px]">Create a Follower Pairing link &rarr;</button>
                                        )}
                                    </div>
                                ) : (
                                    campaigns.map((c: any) => {
                                        const config = c.followerPairingConfig || c.pairing_config;
                                        if (!config) return null;
                                        const isOpen = config.isAcceptingParticipants;
                                        return (
                                            <div key={c.id} className="w-full bg-white border-[1.5px] border-[#FDE68A] rounded-[14px] p-[20px] flex flex-col">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3 w-max">
                                                        <div className="w-[36px] h-[36px] bg-[#FFFBEB] rounded-[8px] flex items-center justify-center text-[24px] shrink-0">🤝</div>
                                                        <h3 className="text-[15px] font-[900] text-[#111] leading-tight flex-1 line-clamp-2">{config.topic}</h3>
                                                    </div>
                                                    {isOpen ? (
                                                        <div className="h-[22px] px-2 bg-[#EDFAF3] border border-[#BBF7D0] text-[#166534] text-[11px] font-[700] rounded-full flex items-center shrink-0 ml-2">Open</div>
                                                    ) : (
                                                        <div className="h-[22px] px-2 bg-[#F6F6F6] border border-[#EEEEEE] text-[#AAAAAA] text-[11px] font-[700] rounded-full flex items-center shrink-0 ml-2">Closed</div>
                                                    )}
                                                </div>

                                                <p className="text-[13px] font-[600] text-[#555] leading-[1.65] line-clamp-3 mb-3">{config.description}</p>
                                                
                                                <div className="flex items-center gap-3 text-[11px] font-[700] text-[#B45309] mb-[16px]">
                                                    <span className="flex items-center gap-1">⏱️ {config.durationDays || config.duration_days} days</span>
                                                    <span className="flex items-center gap-1">👥 {config.activePairs || config.active_pairs || 0} pairs</span>
                                                    <span className="flex items-center gap-1">✅ {config.completedPairs || config.completed_pairs || 0} completed</span>
                                                </div>

                                                {isOpen ? (
                                                    <button onClick={() => navigate(`/r/${c.slug}`)} className="w-full h-[44px] bg-[#B45309] text-white font-[900] text-[14px] rounded-[10px] hover:bg-[#92400E] transition-colors mt-auto">
                                                        Join This Challenge &rarr;
                                                    </button>
                                                ) : (
                                                    <button disabled className="w-full h-[44px] bg-[#F6F6F6] text-[#AAAAAA] font-[700] text-[14px] rounded-[10px] cursor-not-allowed mt-auto">
                                                        Challenge Closed
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
        </div>
            </div>

            <BottomSheet isOpen={showMessageSheet} onClose={() => setShowMessageSheet(false)} title={`Message ${name}`}>
                <div className="pt-2 pb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-[18px]" style={{ backgroundColor: avatarColor || '#E8312A' }}>
                            {initial || name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                            <div className="text-[15px] font-bold text-text">{name}</div>
                            <div className="text-[13px] text-textMid">@{username}</div>
                        </div>
                    </div>
                    
                    <div className="relative mb-4">
                        <textarea 
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Write your introductory message..."
                            maxLength={500}
                            className={`w-full h-[120px] rounded-[14px] bg-surfaceAlt border focus:ring-1 px-4 py-3 text-[14px] font-semibold text-text outline-none resize-none placeholder:text-textLight font-sans ${messageText.length > 0 && messageText.length < 10 ? 'border-error focus:border-error focus:ring-error focus:ring-opacity-20' : 'border-border focus:border-brand/40 focus:ring-brand/40'}`}
                        />
                        <div className={`absolute bottom-3 right-3 text-[11px] font-bold ${messageText.length > 500 ? 'text-error' : messageText.length > 0 && messageText.length < 10 ? 'text-error' : 'text-textLight'}`}>
                            {messageText.length}/500 {messageText.length > 0 && messageText.length < 10 && '(min 10 required)'}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowMessageSheet(false)}
                            className="flex-1 h-12 bg-surfaceAlt text-text font-black text-[14px] rounded-[14px] transition-colors hover:bg-border"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSendMessage}
                            disabled={!messageText.trim() || messageText.trim().length < 10 || messageText.length > 500 || isSending}
                            className={`flex-[2] h-12 text-white font-black text-[14px] rounded-[14px] transition-all flex items-center justify-center ${messageText.trim() && messageText.trim().length >= 10 && messageText.length <= 500 && !isSending ? 'bg-brand shadow-sm hover:scale-[1.02]' : 'bg-brand/50 cursor-not-allowed'}`}
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Send Message Request"
                            )}
                        </button>
                    </div>
                </div>
            </BottomSheet>

            <AuthBottomSheet
                isOpen={isAuthSheetOpen}
                onClose={() => setIsAuthSheetOpen(false)}
                onSuccess={() => {
                    setIsAuthSheetOpen(false);
                    setShowMessageSheet(true);
                }}
                defaultScreen="signin"
            />
        </div>
    );
};
