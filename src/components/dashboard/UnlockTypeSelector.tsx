export type UnlockType = 'custom_sponsor' | 'email_subscribe' | 'social_follow' | 'follower_pairing';

interface UnlockTypeSelectorProps {
    value: UnlockType | null;
    onChange: (type: UnlockType) => void;
}

const UNLOCK_OPTIONS = [
    {
        id: 'email_subscribe' as UnlockType,
        title: 'Email Subscribe',
        subtitle: 'Build your newsletter list',
        icon: '📧',
        bgTint: '#EDFAF3',
    },
    {
        id: 'social_follow' as UnlockType,
        title: 'Social Follow',
        subtitle: 'Grow your social accounts',
        icon: '👥',
        bgTint: '#EFF6FF',
    },
    {
        id: 'custom_sponsor' as UnlockType,
        title: 'Custom Sponsor',
        subtitle: 'Earn 100% of your deal',
        icon: '⭐',
        bgTint: '#F5F3FF',
    }
];

export const UnlockTypeSelector = ({ value, onChange }: UnlockTypeSelectorProps) => {
    return (
        <div className="w-full">
            <h4 
                style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#111',
                    marginBottom: '12px'
                }}
            >
                How do they unlock it?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {UNLOCK_OPTIONS.map((option) => {
                    const isActive = value === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => onChange(option.id)}
                            className="h-[52px] rounded-[12px] p-[12px] flex items-center justify-start gap-[8px] border-[1.5px] transition-all text-left overflow-hidden w-full"
                            style={{
                                borderColor: isActive ? '#111' : '#E8E8E8',
                                backgroundColor: isActive ? '#FAFAFA' : '#FFFFFF',
                            }}
                        >
                            <div 
                                className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-[14px] flex-shrink-0"
                                style={{ backgroundColor: option.bgTint }}
                            >
                                {option.icon}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-[13px] font-[800] text-[#333] tracking-tight leading-tight truncate">
                                    {option.title}
                                </span>
                                <span className="text-[11px] font-[600] text-[#888] truncate mt-[-2px]">
                                    {option.subtitle}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
