import { useState, useEffect } from 'react';
import { Download, Mail, UserCheck } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getAllUniqueSubscribers, exportAllSubscribersCSV } from '../../services/emailSubscribeService';

interface GlobalSubscribersSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GlobalSubscribersSheet = ({ isOpen, onClose }: GlobalSubscribersSheetProps) => {
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const { showToast } = useToast();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (isOpen && currentUser?.id) {
            loadSubscribers();
        }
    }, [isOpen, currentUser?.id]);

    const loadSubscribers = async () => {
        setIsLoading(true);
        try {
            const result = await getAllUniqueSubscribers(currentUser!.id, { pageSize: 100 });
            setSubscribers(result.subscribers);
            setTotal(result.total);
        } catch (err) {
            console.error('Failed to load global subscribers:', err);
            showToast({ message: 'Failed to load subscribers', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        if (!currentUser?.id) return;
        setIsExporting(true);
        try {
            await exportAllSubscribersCSV(currentUser.id);
            showToast({ message: `Exported ${total} unique subscribers.`, type: 'success' });
        } catch (err: any) {
            showToast({ message: err.message, type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="All Subscribers">
            <div className="flex flex-col gap-4 pb-8">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-textMid">Unique Emails Captured</span>
                        <span className="text-[24px] font-black text-text">{total.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={isExporting || total === 0}
                        className="flex items-center gap-2 px-4 h-10 rounded-md bg-brand text-white font-bold text-[13px] hover:bg-brandHover disabled:opacity-50 transition-all shadow-sm"
                    >
                        <Download size={16} />
                        {isExporting ? 'Exporting...' : 'Export All CSV'}
                    </button>
                </div>

                <div className="w-full border-t border-border pt-4">
                    <h3 className="text-[14px] font-black text-text mb-3 flex items-center gap-2">
                        <Mail size={16} className="text-brand" />
                        Recent Subscribers Across All Links
                    </h3>

                    {isLoading ? (
                        <div className="flex flex-col gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-[60px] bg-surfaceAlt animate-pulse rounded-[12px]" />
                            ))}
                        </div>
                    ) : subscribers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-surfaceAlt rounded-[16px] border border-border border-dashed text-center">
                            <UserCheck size={32} className="text-textLight mb-3" />
                            <span className="text-[14px] font-bold text-text">No subscribers yet</span>
                            <span className="text-[12px] font-semibold text-textMid mt-1">Share your email subscribe links to start capturing emails.</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {subscribers.map((sub: any) => (
                                <div key={sub.id} className="flex items-center justify-between p-3.5 rounded-[12px] bg-white border border-border hover:border-brand/30 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-black text-text">{sub.email}</span>
                                        <span className="text-[11px] font-bold text-textLight mt-0.5 uppercase tracking-wide">
                                            {new Date(sub.subscribed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    {sub.content_accessed && (
                                        <span className="text-[10px] font-black text-success bg-successBg px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            Confirmed
                                        </span>
                                    )}
                                </div>
                            ))}
                            {total > subscribers.length && (
                                <p className="text-[12px] text-textMid text-center mt-2 font-bold">
                                    Showing latest {subscribers.length} subscribers. Use Export for full list.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </BottomSheet>
    );
};
