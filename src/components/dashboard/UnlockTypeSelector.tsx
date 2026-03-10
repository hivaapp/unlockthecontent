

export type UnlockType = 'custom_sponsor' | 'email_subscribe' | 'social_follow' | 'accountability';

interface UnlockTypeSelectorProps {
    value: UnlockType | null;
    onChange: (type: UnlockType) => void;
}

const UNLOCK_OPTIONS = [
    {
        id: 'custom_sponsor' as UnlockType,
        title: 'Custom Sponsor',
        subtitle: 'Your sponsor\'s video · 0% fee',
        icon: '⭐',
        color: '#6366F1',
        bgTint: '#EEF2FF',
    },
    {
        id: 'email_subscribe' as UnlockType,
        title: 'Email Subscribe',
        subtitle: 'Build your newsletter list',
        icon: '📧',
        color: '#166534',
        bgTint: '#F0FDF4',
    },
    {
        id: 'social_follow' as UnlockType,
        title: 'Social Follow',
        subtitle: 'Grow your following',
        icon: '👥',
        color: '#2563EB',
        bgTint: '#EFF6FF',
    },
    {
        id: 'accountability' as UnlockType,
        title: 'Accountability Pair',
        subtitle: 'Pair viewers as partners',
        icon: '🤝',
        color: '#92400E',
        bgTint: '#FFFBEB',
    }
];

export const UnlockTypeSelector = ({ value, onChange }: UnlockTypeSelectorProps) => {
    return (
        <div className="grid grid-cols-2 gap-3">
            {UNLOCK_OPTIONS.map((option) => {
                const isActive = value === option.id;
                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onChange(option.id)}
                        className={`h-[80px] rounded-[14px] p-2.5 flex flex-col justify-center items-start border-[1.5px] transition-all text-left overflow-hidden`}
                        style={{
                            borderColor: isActive ? option.color : '#E8E8E8',
                            backgroundColor: isActive ? option.bgTint : '#FFFFFF',
                            boxShadow: isActive ? `0 0 0 1px ${option.color}20` : 'none'
                        }}
                    >
                        <div className="flex items-center gap-2 w-full mb-1">
                            <div 
                                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[16px] flex-shrink-0"
                                style={{ backgroundColor: option.bgTint }}
                            >
                                {option.icon}
                            </div>
                            <span 
                                className="text-[13px] font-[800] tracking-tight leading-tight truncate"
                                style={{ color: isActive ? option.color : '#111' }}
                            >
                                {option.title}
                            </span>
                        </div>
                        <span className="text-[11px] font-[600] text-textMid truncate w-full pl-10">
                            {option.subtitle}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
