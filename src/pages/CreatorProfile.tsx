import { useParams, Link } from 'react-router-dom';
import { FileIcon, Sparkles, User2, Play } from 'lucide-react';

export const CreatorProfile = () => {
    const { username } = useParams();

    // Mock links data
    const links = [
        { id: '1', title: 'Figma Complete UI Kit 2026', type: 'FILE', views: 1205 },
        { id: '2', title: 'Notion Life Planner Template', type: 'LINK', views: 804 },
        { id: '3', title: '50+ Free Procreate Brushes', type: 'FILE', views: 3200, donate: true },
        { id: '4', title: 'Design Interview Prep Guide', type: 'FILE', views: 420 },
    ];

    return (
        <div className="w-full min-h-screen bg-bg flex justify-center pb-12 animate-fade-in relative overflow-hidden">
            {/* Top decorative gradient */}
            <div className="absolute top-0 left-0 w-full h-[240px] bg-gradient-to-b from-brand/10 to-transparent pointer-events-none" />

            <div className="w-full max-w-[600px] px-5 pt-16 sm:pt-24 relative z-10">

                {/* Profile Header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-[100px] h-[100px] rounded-[32px] bg-gradient-to-br from-brand to-brandHover flex items-center justify-center text-white font-black text-4xl shadow-[0_8px_32px_rgba(217,119,87,0.4)] mb-5 rotate-3">
                        <span className="-rotate-3">{username?.[0]?.toUpperCase() || 'C'}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 mb-4">
                        <h1 className="text-[28px] font-black tracking-tight text-text leading-tight flex items-center gap-2">
                            @{username || 'creator'}
                            <div className="bg-brand/10 text-brand p-1 rounded-full shrink-0">
                                <Sparkles size={16} strokeWidth={3} />
                            </div>
                        </h1>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EBF5EE] border border-[#BBF7D0] rounded-full">
                            <span className="text-[14px]">🌳</span>
                            <span className="text-[11px] font-[800] text-[#166534] uppercase tracking-wide">Planting Trees</span>
                        </div>
                    </div>

                    <p className="text-[16px] font-[800] text-textMid max-w-[360px] leading-relaxed">
                        Digital designer sharing free resources, templates, and assets. Support my work by unlocking links.
                    </p>

                    <div className="mt-4 flex gap-4 overflow-x-auto w-full max-w-full pb-2 hide-scrollbar justify-center sm:justify-center">
                        <div className="flex items-center gap-1.5 text-textMid font-bold text-[13px] shrink-0">
                            <FileIcon size={16} strokeWidth={2.5} />
                            {links.length} Resources
                        </div>
                        <div className="w-[1px] h-4 bg-border my-auto shrink-0" />
                        <div className="flex items-center gap-1.5 text-textMid font-bold text-[13px] shrink-0">
                            <User2 size={16} strokeWidth={2.5} />
                            5.6K Unlocks
                        </div>
                        <div className="w-[1px] h-4 bg-border my-auto shrink-0" />
                        <div className="flex items-center gap-1.5 text-[#166534] font-bold text-[13px] shrink-0">
                            <span className="text-[16px]">🌳</span>
                            240 Trees Planted
                        </div>
                    </div>
                </div>

                {/* Main Link Group */}
                <div className="flex flex-col gap-3 mt-10">
                    <h2 className="text-[13px] font-extrabold text-textMid uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand/50" />
                        Available Resources
                    </h2>

                    {links.map(link => (
                        <Link
                            to={`/r/mock-slug-${link.id}`}
                            key={link.id}
                            className="w-full bg-white border border-border rounded-[20px] p-4 flex items-center justify-between hover:border-brand/30 hover:shadow-[0_4px_24px_rgba(217,119,87,0.08)] transition-all group relative overflow-hidden active:scale-[0.98]"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brandTint rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex items-center gap-4 overflow-hidden relative z-10 w-full pr-4">
                                <div className="w-12 h-12 bg-surfaceAlt border border-border/50 rounded-[14px] flex items-center justify-center shrink-0 group-hover:bg-brandTint group-hover:border-brand/20 transition-colors">
                                    <FileIcon size={24} strokeWidth={2.5} className="text-textMid group-hover:text-brand transition-colors" />
                                </div>

                                <div className="flex flex-col items-start truncate text-left w-full pr-2">
                                    <span className="text-[16px] font-black tracking-tight text-text truncate w-full mb-1 group-hover:text-brand transition-colors">
                                        {link.title}
                                    </span>

                                    <div className="flex items-center gap-2 overflow-hidden w-full mt-1">
                                        <span className="text-[12px] font-extrabold bg-surfaceAlt text-textLight px-1.5 py-0.5 rounded-[14px] tracking-wide">
                                            {link.type}
                                        </span>
                                        {link.donate && (
                                            <div className="flex items-center gap-1 text-[11px] font-[800] text-[#166534] bg-[#EBF5EE] px-1.5 py-0.5 rounded-[14px] ml-auto sm:ml-2 shrink-0">
                                                🌳 5% to trees
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 h-[40px] px-5 bg-text hover:bg-black text-white rounded-full font-black text-[13px] flex items-center justify-center relative z-10 transition-colors shadow-sm gap-1.5">
                                <Play size={14} fill="currentColor" />
                                Unlock
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Empty State Mock */}
                {links.length === 0 && (
                    <div className="w-full py-16 flex flex-col items-center justify-center text-center mt-4">
                        <div className="w-16 h-16 bg-surfaceAlt rounded-full flex items-center justify-center text-textLight mb-4">
                            <FileIcon size={24} strokeWidth={2} />
                        </div>
                        <h3 className="text-[18px] font-black text-text mb-2">No active links</h3>
                        <p className="text-[14px] font-bold text-textMid px-8">This creator hasn't published any resources yet.</p>
                    </div>
                )}

                {/* Footer Brand Credit */}
                <div className="mt-16 pb-8 flex justify-center">
                    <a href="/" className="group flex items-center gap-2 text-[12px] font-extrabold text-textMid/60 uppercase tracking-widest hover:text-textMid transition-colors">
                        Powered by
                        <span className="text-text tracking-tight font-black group-hover:text-brand transition-colors flex items-center gap-1">
                            <div className="w-4 h-4 rounded-[4px] bg-brand text-white flex items-center justify-center text-[6px] shadow-sm">AG</div>
                            AdGate
                        </span>
                    </a>
                </div>

            </div>
        </div>
    );
};
