import React, { useState, useRef } from 'react';
import { UploadCloud, X, File as FileIcon, Link as LinkIcon } from 'lucide-react';

export type ContentMode = "file" | "text" | "both";

export interface LinkItem {
    url: string;
    title: string;
}

export interface ContentData {
    contentMode: ContentMode;
    textContent: string;
    links: LinkItem[];
    file: File | null;
}

interface ContentBuilderProps {
    value: ContentData;
    onChange: (data: ContentData) => void;
    isSheet?: boolean;
}

// Helper to reliably get a domain initial and a color based on hash
const getDomainInitial = (url: string) => {
    try {
        const hostname = new URL(url).hostname;
        const base = hostname.replace(/^www\./, '');
        return base.charAt(0).toUpperCase();
    } catch {
        return url.charAt(0).toUpperCase();
    }
};

const getDomainName = (url: string) => {
    try {
        const hostname = new URL(url).hostname;
        return hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
};

const getDomainColor = (url: string) => {
    const colors = ['#E8312A', '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = url.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export const ContentBuilder: React.FC<ContentBuilderProps> = ({ value, onChange, isSheet = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Link Adder State
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');
    const [linkError, setLinkError] = useState('');

    // Paste Detection
    const [pastePrompt, setPastePrompt] = useState<{ url: string, position: { top: number, left: number } } | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onChange({ ...value, file: e.dataTransfer.files[0] });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onChange({ ...value, file: e.target.files[0] });
        }
    };

    const removeFile = () => onChange({ ...value, file: null });

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Enforce 5000 chars limit
        const newText = e.target.value;
        if (newText.length <= 5000) {
            onChange({ ...value, textContent: newText });
        }
        if (pastePrompt) setPastePrompt(null);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData.getData('text');
        const urlRegex = /^https?:\/\/[^\s]+$/i;

        if (urlRegex.test(pastedText.trim())) {
            // It's a URL!
            if (value.links.length < 10 && !value.links.some(l => l.url === pastedText.trim())) {
                const target = e.target as HTMLTextAreaElement;
                // Get approximate caret position (crude but works for floating pill)
                // In a real app we'd measure text node coordinates, but standard fixed offset works for mock
                // just show it relative to the textarea
                setPastePrompt({ url: pastedText.trim(), position: { top: Math.min(target.offsetHeight - 50, 40), left: 20 } });
            }
        }
    };

    const acceptPastedUrl = () => {
        if (!pastePrompt) return;
        const newUrl = pastePrompt.url;
        // Remove the pasted URL from the text (it was already pasted by native behavior)
        const updatedText = value.textContent.replace(newUrl, '').trim();

        onChange({
            ...value,
            textContent: updatedText,
            links: [...value.links, { url: newUrl, title: getDomainName(newUrl) }]
        });
        setPastePrompt(null);
    };

    const rejectPastedUrl = () => {
        setPastePrompt(null);
    };

    const handleAddLinkOpen = () => {
        if (value.links.length >= 10) return;
        setIsAddingLink(true);
        setLinkUrl('');
        setLinkTitle('');
        setLinkError('');
    };

    const validateAndAddLink = (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        
        let finalUrl = linkUrl.trim();
        if (!finalUrl) return;

        if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = 'https://' + finalUrl;
        }

        if (!finalUrl.includes('.')) {
            setLinkError("Please enter a valid URL like https://example.com");
            return;
        }

        const isDuplicate = value.links.some(l => l.url.toLowerCase() === finalUrl.toLowerCase());
        if (isDuplicate) {
            setLinkError("Already added");
            return;
        }

        const finalTitle = linkTitle.trim() || getDomainName(finalUrl);

        onChange({
            ...value,
            links: [...value.links, { url: finalUrl, title: finalTitle }]
        });

        setIsAddingLink(false);
        setLinkUrl('');
        setLinkTitle('');
        setLinkError('');
    };

    const removeLink = (index: number) => {
        const newLinks = [...value.links];
        newLinks.splice(index, 1);
        onChange({ ...value, links: newLinks });
    };

    const textLength = value.textContent.length;
    const isTextMode = true;
    const isBothMode = true;
    const isFileMode = true;

    return (
        <div className="w-full flex flex-col items-center">
            {/* The Main Container Card */}
            <div className={`w-full bg-white rounded-[18px] transition-all overflow-hidden flex flex-col relative
                ${isTextMode ? 'border-[1.5px] border-solid border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.06)]' :
                    isDragging ? 'border-[2px] border-dashed border-[#E8312A] bg-[#FFF0EF]' :
                        'border-[2px] border-dashed border-[#E8E8E8]'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />

                {isTextMode && (
                    <div className="flex flex-col w-full relative">
                        {/* Text Area */}
                        <div className="relative w-full">
                            <textarea
                                value={value.textContent}
                                onChange={handleTextChange}
                                onPaste={handlePaste}
                                placeholder="Write your content here — tips, links, instructions, code, anything..."
                                className={`w-full p-4 border-none outline-none resize-none bg-transparent 
                                    text-[#111] placeholder-[#BBBBBB]
                                    ${isSheet ? 'h-[160px]' : 'min-h-[120px] max-h-[320px]'}`}
                                style={{
                                    fontFamily: '"Nunito", sans-serif',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    lineHeight: 1.7
                                }}
                            />
                            {/* Char Counter */}
                            <div className={`absolute bottom-3 right-3 text-[11px] font-[700] bg-white/80 px-1 rounded
                                ${textLength >= 5000 ? 'text-[#E8312A]' : textLength >= 4500 ? 'text-[#F59E0B]' : 'text-[#AAAAAA]'}`}>
                                {textLength} / 5000
                            </div>

                            {/* Paste Pill */}
                            {pastePrompt && (
                                <div
                                    className="absolute bg-[#111] text-white rounded-full px-3 py-1.5 flex items-center gap-3 shadow-lg z-10 slide-in-bottom-1"
                                    style={{ top: pastePrompt.position.top, left: pastePrompt.position.left }}
                                >
                                    <span className="text-[12px] font-[700]">Add as link card instead?</span>
                                    <div className="flex gap-2">
                                        <button onClick={rejectPastedUrl} className="text-[#999] hover:text-white">✗</button>
                                        <button onClick={acceptPastedUrl} className="text-[#10B981]">✓</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Link Cards */}
                        {value.links.length > 0 && (
                            <div className="px-4 pb-0 flex flex-col gap-2">
                                {value.links.map((link, idx) => (
                                    <div key={idx} className="w-full h-[56px] bg-[#F8F8F8] rounded-[10px] border border-[#E8E8E8] flex items-center px-3 gap-3 animate-fadeIn">
                                        <div
                                            className="w-[32px] h-[32px] rounded-[6px] flex items-center justify-center text-white font-[900] text-[16px] shrink-0"
                                            style={{ backgroundColor: getDomainColor(link.url) }}
                                        >
                                            {getDomainInitial(link.url)}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[13px] font-[800] text-[#111] truncate leading-tight">{link.title}</span>
                                            <span className="text-[11px] text-[#999] truncate leading-tight mt-0.5">{getDomainName(link.url)}</span>
                                        </div>
                                        <button onClick={() => removeLink(idx)} className="w-[28px] h-[28px] rounded-[6px] hover:bg-[#EAEAEA] flex items-center justify-center text-[#999] hover:text-[#555] shrink-0">
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Link Section */}
                        <div className="p-4 pt-3">
                            {!isAddingLink ? (
                                <button
                                    onClick={handleAddLinkOpen}
                                    disabled={value.links.length >= 10}
                                    className="h-[36px] px-4 rounded-[6px] border border-[#E8E8E8] hover:bg-[#F8F8F8] transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-[#555]"
                                    title={value.links.length >= 10 ? 'Max 10 links' : ''}
                                >
                                    <span className="text-[13px] font-[700]">＋ Add Link</span>
                                </button>
                            ) : (
                                <div className="w-full border-t border-[#F0F0F0] pt-3 animate-fadeIn slide-in-top-2">
                                    <div className="relative w-full mb-2">
                                        <div className="absolute left-3 top-0 h-[44px] flex items-center text-[#999]">
                                            <LinkIcon size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={linkUrl}
                                            onChange={e => setLinkUrl(e.target.value)}
                                            placeholder="Paste a URL here..."
                                            className="w-full h-[44px] bg-[#F8F8F8] border border-[#E8E8E8] rounded-[8px] pl-9 pr-[60px] text-[14px] font-[600] text-[#111] outline-none focus:border-[#E8312A]/50 focus:bg-white"
                                            autoFocus
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') validateAndAddLink(e);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={validateAndAddLink}
                                            className="absolute right-1.5 top-1.5 h-[32px] px-4 bg-[#E8312A] text-white rounded-[50px] text-[12px] font-[800] hover:bg-[#C4663F]"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={linkTitle}
                                        onChange={e => setLinkTitle(e.target.value)}
                                        placeholder="Link title (optional)"
                                        className="w-full h-[40px] bg-white border border-[#E8E8E8] rounded-[8px] px-3 text-[13px] font-[600] text-[#111] placeholder-[#BBB] outline-none focus:border-[#E8312A]/50"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') validateAndAddLink(e);
                                        }}
                                    />
                                    {linkError && (
                                        <p className="text-[12px] text-[#E8312A] font-[700] mt-1.5 ml-1">{linkError}</p>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {isBothMode && (
                    <div className="w-full relative h-[20px] bg-white flex items-center justify-center">
                        <div className="absolute w-full h-[1px] bg-[#F0F0F0]" />
                        <span className="relative z-10 bg-white px-3 text-[11px] font-[800] text-textMid flex items-center gap-1 cursor-pointer hover:text-text" onClick={() => !value.file && fileInputRef.current?.click()}>
                            ＋ Attach File
                        </span>
                    </div>
                )}

                {isFileMode && (
                    <div
                        className={`w-full flex flex-col items-center justify-center p-4 cursor-pointer transition-colors
                            ${!value.file ? (isBothMode ? 'h-[80px] bg-[#FAFAFA] hover:bg-[#F3F3F3]' : 'h-[180px]') : (isBothMode ? 'h-auto pb-4 bg-white' : 'h-[180px]')}`}
                        onClick={() => !value.file && fileInputRef.current?.click()}
                    >
                        {!value.file ? (
                            isBothMode ? (
                                <span className="text-[14px] font-[700] text-[#999]">Drag a file or tap to attach</span>
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-[12px] bg-[#FFF0EF] text-[#E8312A] flex items-center justify-center mb-3">
                                        <UploadCloud size={24} />
                                    </div>
                                    <h4 className="font-[900] text-[16px] text-[#111] mb-0.5">Drop your file here</h4>
                                    <p className="font-[600] text-[14px] text-[#999] mb-3">or tap to browse</p>
                                    <div className="flex gap-2">
                                        {["PDF", "ZIP", "MP4", "PNG", "TXT"].map(k => (
                                            <div key={k} className="h-6 px-2.5 rounded-full bg-surfaceAlt text-[11px] font-[700] text-[#666] flex items-center">
                                                {k}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="w-full flex items-center justify-between">
                                <div className="flex items-center flex-1 min-w-0 pr-3">
                                    <div className="w-12 h-12 bg-[#F5F5F5] text-text rounded-[10px] flex items-center justify-center shrink-0">
                                        <FileIcon size={24} />
                                    </div>
                                    <div className="ml-3 flex flex-col min-w-0">
                                        <span className="font-[800] text-[14px] text-[#111] truncate">{value.file.name}</span>
                                        <span className="text-[12px] text-[#666]">{(value.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#E8312A] bg-[#FFF0EF] shrink-0">
                                    <X size={16} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
