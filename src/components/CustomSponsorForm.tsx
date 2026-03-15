import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Check, Link as LinkIcon, MousePointerClick, Video, X } from "lucide-react";
import { uploadFile, validateFile, formatFileSize } from '../services/uploadService';

export interface CustomAdData {
    fileName: string;
    fileSize: number;
    fileMimeType: string;
    previewUrl: string;
    redirectUrl: string | null;
    ctaText: string;
    brandName: string;
    skipAfter: number;
    fileId: string | null;        // R2 file ID after upload
    isUploading?: boolean;
    uploadError?: string | null;
}

interface CustomSponsorFormProps {
    value?: CustomAdData | null;
    onChange?: (data: CustomAdData | null) => void;
    onErrorStateChange?: (hasErrors: boolean) => void;
    isAuthenticated?: boolean;
    onPendingFile?: (file: File) => void;
}

export function CustomSponsorForm({ value, onChange, onErrorStateChange, isAuthenticated = true, onPendingFile }: CustomSponsorFormProps) {
    const defaultData: CustomAdData = {
        fileName: "",
        fileSize: 0,
        fileMimeType: "",
        previewUrl: "",
        redirectUrl: "",
        ctaText: "",
        brandName: "",
        skipAfter: 5,
        fileId: null,
        isUploading: false,
        uploadError: null,
    };

    const [data, setData] = useState<CustomAdData>(value || defaultData);
    const [acknowledged, setAcknowledged] = useState(false);
    const [prevValue, setPrevValue] = useState<CustomAdData | null | undefined>(value);
    const [showErrors, setShowErrors] = useState(false);
    const [shakeAck, setShakeAck] = useState(false);
    const [previewTab, setPreviewTab] = useState<"watch" | "click">("watch");

    // Upload state
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStage, setUploadStage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    if (value !== prevValue) {
        setPrevValue(value);
        if (value) {
            setData(value);
            if (!acknowledged) {
                setAcknowledged(true);
            }
        }
    }

    useEffect(() => {
        const isError = !data.brandName || !data.fileName || !acknowledged
            || ((data.redirectUrl?.length ?? 0) > 0 && !(data.redirectUrl?.startsWith("http") ?? false))
            || data.isUploading
            || !!data.uploadError;
        if (onErrorStateChange) {
            onErrorStateChange(isError);
        }
        if (onChange) {
            onChange(acknowledged ? data : null);
        }
    }, [data, acknowledged, onErrorStateChange, onChange]);

    const handleDataChange = (updates: Partial<CustomAdData>) => {
        const newData = { ...data, ...updates };
        setData(newData);
    };

    // ── Real file upload handler ──────────────────────────────────────────
    const handleFileSelect = useCallback(async (file: File) => {
        // Client-side validation
        const validation = validateFile(file, 'sponsor');
        if (!validation.valid) {
            handleDataChange({
                uploadError: validation.error,
            });
            return;
        }

        // Create a preview URL for video
        const previewUrl = URL.createObjectURL(file);

        if (!isAuthenticated) {
            onPendingFile?.(file);
            handleDataChange({
                fileName: file.name,
                fileSize: file.size,
                fileMimeType: file.type,
                previewUrl,
                isUploading: false,
                uploadError: null,
                fileId: null,
            });
            return;
        }

        handleDataChange({
            fileName: file.name,
            fileSize: file.size,
            fileMimeType: file.type,
            previewUrl,
            isUploading: true,
            uploadError: null,
            fileId: null,
        });

        setUploadProgress(0);
        setUploadStage('preparing');
        abortRef.current = new AbortController();

        try {
            const result = await uploadFile(file, 'sponsor', {
                onProgress: (p: number) => setUploadProgress(p),
                onStageChange: (s: string) => setUploadStage(s),
                signal: abortRef.current.signal,
            });

            // Upload complete — store the real fileId
            setData(prev => ({
                ...prev,
                fileId: result.fileId,
                isUploading: false,
                uploadError: null,
            }));
            setUploadStage(null);
        } catch (err: any) {
            if (err.message !== 'Upload cancelled.') {
                setData(prev => ({
                    ...prev,
                    isUploading: false,
                    uploadError: err.message || 'Upload failed',
                    fileId: null,
                }));
            }
            setUploadStage(null);
        } finally {
            abortRef.current = null;
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        e.target.value = '';
    };

    const handleCancelUpload = () => {
        abortRef.current?.abort();
        handleDataChange({
            fileName: '',
            fileSize: 0,
            fileMimeType: '',
            previewUrl: '',
            fileId: null,
            isUploading: false,
            uploadError: null,
        });
        setUploadProgress(0);
        setUploadStage(null);
    };

    const removeFile = () => {
        if (data.previewUrl) {
            URL.revokeObjectURL(data.previewUrl);
        }
        handleDataChange({
            fileName: "",
            fileSize: 0,
            fileMimeType: "",
            previewUrl: "",
            fileId: null,
            isUploading: false,
            uploadError: null,
        });
        setUploadProgress(0);
        setUploadStage(null);
    };

    const brandError = showErrors && !data.brandName;
    const urlError = showErrors && !!data.redirectUrl && (!data.redirectUrl.startsWith("http://") && !data.redirectUrl.startsWith("https://"));
    const ackError = showErrors && !acknowledged;

    useEffect(() => {
        const handleTrigger = () => {
            setShowErrors(true);
            if (!acknowledged) {
                setShakeAck(true);
                setTimeout(() => setShakeAck(false), 300);
            }
        };
        window.addEventListener("CUSTOM_SPONSOR_VALIDATE", handleTrigger);
        return () => window.removeEventListener("CUSTOM_SPONSOR_VALIDATE", handleTrigger);
    }, [acknowledged]);

    const STAGE_LABELS: Record<string, string> = {
        validating: 'Checking file...',
        preparing: 'Preparing upload...',
        uploading: 'Uploading...',
        confirming: 'Finishing...',
        complete: 'Upload complete',
    };

    // Computed properties for the UI
    const isTwoStep = (data.redirectUrl?.length ?? 0) > 0;

    return (
        <div className="flex flex-col gap-6 w-full mt-4">
            {/* Section A - Upload */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[13px] font-[800] text-[#333]">Ad Creative</span>
                    <div className="bg-[#EDE9FE] text-[#6366F1] text-[10px] font-[800] px-2.5 h-6 rounded-full flex items-center">
                        Video Only · Max 20MB
                    </div>
                </div>

                {/* ── Uploading state ────────────────────────────────────── */}
                {data.isUploading ? (
                    <div className="w-full rounded-[10px] border border-[#C4B5FD] bg-white p-[14px] mt-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[13px] font-[700] text-[#21201C] truncate flex-1 mr-2">
                                {data.fileName}
                            </span>
                            <span className="text-[13px] font-[800] text-[#6366F1]">
                                {uploadProgress}%
                            </span>
                        </div>
                        <div className="w-full h-[6px] bg-[#F3F1EC] rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-[#6366F1] rounded-full transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#AAA49C] font-[600]">
                                {STAGE_LABELS[uploadStage || ''] || 'Uploading...'}
                            </span>
                            <button
                                onClick={handleCancelUpload}
                                className="text-[11px] text-[#C0392B] font-[700] hover:underline"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : !data.fileName ? (
                    /* ── Empty state — tap to upload ──────────────────── */
                    <>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-[100px] border border-dashed border-[#C4B5FD] rounded-[10px] bg-[#FAFAFF] flex flex-col items-center justify-center gap-1 mt-1 transition-colors hover:bg-[#F5F3FF]"
                        >
                            <Play size={24} className="text-[#6366F1]" />
                            <span className="text-[13px] font-[700] text-[#6366F1]">Tap to upload sponsor video</span>
                            <span className="text-[11px] text-[#AAA49C]">
                                MP4, MOV, WebM · Max 20MB
                            </span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm,video/avi,.mp4,.mov,.webm,.avi"
                            onChange={handleInputChange}
                            style={{ display: 'none' }}
                        />
                    </>
                ) : (
                    /* ── File uploaded state ──────────────────────────── */
                    <div className="w-full rounded-[10px] border border-[#C4B5FD] bg-white p-[14px] flex items-center mt-1 relative">
                        <div className="w-[60px] h-[60px] bg-[#1A1A1A] rounded-[14px] flex items-center justify-center shrink-0 overflow-hidden">
                            {data.previewUrl ? (
                                <video
                                    src={data.previewUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                />
                            ) : (
                                <Play size={20} className="text-white fill-white" />
                            )}
                        </div>
                        <div className="ml-3 flex flex-col flex-1 min-w-0 pr-8">
                            <span className="text-[13px] font-[700] text-[#21201C] truncate">{data.fileName}</span>
                            <span className="text-[11px] text-[#AAA49C] mt-0.5">{formatFileSize(data.fileSize)}</span>
                            {data.fileId && (
                                <span className="text-[10px] text-[#417A55] font-[700] mt-1 flex items-center gap-1">
                                    <Check size={10} strokeWidth={3} /> Uploaded
                                </span>
                            )}
                            {data.uploadError && (
                                <span className="text-[10px] text-[#C0392B] font-[700] mt-1">
                                    ⚠️ {data.uploadError}
                                </span>
                            )}
                        </div>
                        <button onClick={removeFile} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#888] hover:bg-[#eee]">
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Upload error banner */}
                {data.uploadError && !data.isUploading && !data.fileName && (
                    <div className="px-3 py-2 bg-[#FDECEA] border border-[#C0392B20] rounded-lg">
                        <span className="text-[12px] font-[600] text-[#C0392B]">
                            ⚠️ {data.uploadError}
                        </span>
                    </div>
                )}

                {/* Duration controls */}
                {data.fileName && !data.isUploading && (
                    <div className="flex items-center gap-6 mt-2 animate-in fade-in slide-in-from-top-2 duration-250">
                        <div className="flex flex-col gap-1">
                            <span className="text-[12px] font-[700] text-[#666]">Skip after</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleDataChange({ skipAfter: Math.max(3, data.skipAfter - 1) })}
                                    className="w-7 h-7 rounded-[14px] bg-[#F5F5F5] flex items-center justify-center font-[700] text-[#666]"
                                >-</button>
                                <div className="w-12 h-9 border border-[#E8E8E8] rounded-[14px] flex items-center justify-center text-[13px] font-[800] text-[#333]">
                                    {data.skipAfter}
                                </div>
                                <button
                                    onClick={() => handleDataChange({ skipAfter: Math.min(15, data.skipAfter + 1) })}
                                    className="w-7 h-7 rounded-[14px] bg-[#F5F5F5] flex items-center justify-center font-[700] text-[#666]"
                                >+</button>
                            </div>
                        </div>
                    </div>
                )}
                {data.fileName && !data.isUploading && (
                    <span className="text-[12px] text-[#AAA49C]">Viewers can skip after {data.skipAfter} seconds. Full view earns more trust.</span>
                )}
            </div>

            {/* Section B - Sponsor Details */}
            <div className="flex flex-col gap-4">
                <span className="text-[13px] font-[800] text-[#333]">Sponsor Details</span>

                <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[12px] font-[700] text-[#6B6860]">Sponsor / Brand Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Notion, Your Brand Name"
                        value={data.brandName}
                        onChange={(e) => handleDataChange({ brandName: e.target.value.substring(0, 40) })}
                        className={`h-11 rounded-[10px] border px-3 text-[14px] outline-none transition-colors ${brandError ? "border-[#C0392B] focus:border-[#C0392B]" : "border-[#E8E8E8] focus:border-[#6366F1]"}`}
                    />
                    {data.brandName.length >= 30 && (
                        <span className="absolute top-0 right-1 text-[11px] text-[#AAA49C]">{data.brandName.length}/40</span>
                    )}
                    {brandError && <span className="text-[11px] text-[#C0392B]">Brand name is required</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-[700] text-[#6B6860]">Sponsor Website URL (optional)</label>
                    <input
                        type="text"
                        placeholder="https://yoursponsor.com"
                        value={data.redirectUrl ?? ""}
                        onChange={(e) => {
                            handleDataChange({ redirectUrl: e.target.value });
                        }}
                        onBlur={() => setShowErrors(true)}
                        className={`h-11 rounded-[10px] border px-3 text-[14px] outline-none transition-colors ${urlError ? "border-[#C0392B] focus:border-[#C0392B]" : "border-[#E8E8E8] focus:border-[#6366F1]"}`}
                    />
                    {urlError ? (
                        <span className="text-[11px] text-[#C0392B]">Please enter a valid URL starting with https://</span>
                    ) : (
                        <div className={`mt-1 p-2.5 rounded-[14px] text-[11.5px] font-[600] transition-colors flex gap-2 items-start ${isTwoStep ? 'bg-[#F5F3FF] text-[#6366F1]' : 'bg-[#F5F5F5] text-[#888]'}`}>
                            <LinkIcon size={14} className="mt-0.5 shrink-0" />
                            {isTwoStep
                                ? "URL provided. Viewers will watch the video AND click through to this site to unlock."
                                : "Leave empty for Video Only format. Fans just watch the video to unlock."}
                        </div>
                    )}
                </div>

                {/* CTA Button is only visible if URL is there */}
                <div
                    className={`flex flex-col gap-1.5 relative overflow-hidden transition-all duration-300 ease-in-out ${isTwoStep ? 'max-h-[120px] opacity-100 mt-2' : 'max-h-0 opacity-0 m-0'}`}
                >
                    <label className="text-[12px] font-[700] text-[#6B6860]">Call to Action Text</label>
                    <input
                        type="text"
                        placeholder="e.g. Visit Sponsor, Shop Now"
                        value={data.ctaText}
                        onChange={(e) => handleDataChange({ ctaText: e.target.value.substring(0, 24) })}
                        className="h-11 rounded-[10px] border border-[#E8E8E8] focus:border-[#6366F1] px-3 text-[14px] outline-none transition-colors"
                    />
                    <span className="absolute top-0 right-1 text-[11px] text-[#AAA49C]">{data.ctaText.length}/24</span>

                    <div className="flex overflow-x-auto gap-2 pb-1 mt-1 scrollbar-hide">
                        {["Visit Sponsor", "Shop Now", "Try Free", "Learn More", "Get Offer"].map(chip => (
                            <button
                                key={chip}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDataChange({ ctaText: chip });
                                }}
                                className="h-[28px] px-3 rounded-full border border-[#E8E8E8] text-[#666] text-[12px] font-[600] whitespace-nowrap bg-white hover:bg-[#F5F5F5] transition-colors shrink-0"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ad Format Summary */}
            <div className="flex flex-col gap-3 card shadow-none bg-surface border-border p-4">
                <span className="text-[13px] font-[800] text-text">Ad Format Summary</span>
                {isTwoStep ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#6366F1] text-white text-[10px] font-black uppercase">Two Step Format</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surfaceAlt flex items-center justify-center shrink-0">
                                <Video size={14} className="text-text" />
                            </div>
                            <span className="text-[12px] font-semibold text-text">1. Viewer watches your sponsor video</span>
                        </div>
                        <div className="w-0.5 h-3 bg-border ml-4" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brandTint flex items-center justify-center shrink-0">
                                <MousePointerClick size={14} className="text-brand" />
                            </div>
                            <span className="text-[12px] font-semibold text-text">2. Viewer clicks through to website</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-[4px] bg-surfaceAlt border border-border text-textMid text-[10px] font-black uppercase">Single Step Format</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surfaceAlt flex items-center justify-center shrink-0">
                                <Video size={14} className="text-text" />
                            </div>
                            <span className="text-[12px] font-semibold text-text">Viewer only needs to watch your video</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Section C - Ad Preview */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mt-2">
                    <span className="text-[13px] font-[800] text-[#333]">Live Preview</span>
                    {isTwoStep && (
                        <div className="flex gap-1 bg-surfaceAlt p-0.5 rounded-[14px]">
                            <button
                                onClick={(e) => { e.preventDefault(); setPreviewTab("watch"); }}
                                className={`px-2 py-1 text-[11px] font-bold rounded-[14px] transition-colors ${previewTab === "watch" ? "bg-white text-text shadow-sm" : "text-textMid hover:text-text"}`}
                            >
                                Step 1
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); setPreviewTab("click"); }}
                                className={`px-2 py-1 text-[11px] font-bold rounded-[14px] transition-colors ${previewTab === "click" ? "bg-[#6366F1] text-white shadow-sm" : "text-textMid hover:text-text"}`}
                            >
                                Step 2
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-full bg-[#1A1A1A] p-2 rounded-[22px] border-[8px] border-[#1A1A1A]">
                    <div className="w-full h-[320px] rounded-[14px] bg-black relative overflow-hidden flex flex-col justify-end">

                        {(previewTab === "watch" || !isTwoStep) ? (
                            <>
                                {!data.fileName ? (
                                    <div className="absolute inset-0 bg-[#2A2A2A] flex flex-col items-center justify-center cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}>
                                        <Video size={32} className="text-white mb-2" />
                                        <span className="text-[12px] text-[#AAA49C]">Upload your creative to see a preview</span>
                                    </div>
                                ) : data.previewUrl ? (
                                    <video
                                        src={data.previewUrl}
                                        className="absolute inset-0 w-full h-full object-contain"
                                        muted
                                        playsInline
                                        loop
                                        autoPlay
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <Play size={32} className="text-white fill-white mb-2" />
                                        <span className="text-[12px] text-[#AAA49C]">Your video will play here</span>
                                    </div>
                                )}

                                <div className="absolute top-3 left-3 bg-[#444] text-[10px] font-[800] text-white px-2 py-0.5 rounded-[14px] flex tracking-wider">
                                    AD
                                </div>
                                {isTwoStep && (
                                    <div className="absolute top-3 right-3 bg-[rgba(0,0,0,0.4)] text-[10px] font-black text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                                        STEP 1 OF 2
                                    </div>
                                )}

                                {data.fileName && (
                                    <div className="absolute bottom-6 right-3 bg-[rgba(255,255,255,0.1)] text-white text-[12px] font-[700] px-3 py-1.5 rounded-full backdrop-blur-md">
                                        Skip Ad ›
                                    </div>
                                )}

                                {/* Progress bar */}
                                <div className="absolute bottom-0 left-0 h-1 bg-[rgba(255,255,255,0.3)] w-full z-20">
                                    <div className="h-full bg-brand w-1/3 rounded-r-full" />
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-white flex flex-col pt-12 p-4 items-center">
                                {/* Success Strip */}
                                <div className="w-full h-10 bg-successBg rounded-[14px] flex items-center justify-center gap-2 mb-6">
                                    <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                                        <Check size={12} className="text-white" strokeWidth={4} />
                                    </div>
                                    <span className="text-[13px] font-black text-success">Step 1 Complete!</span>
                                </div>
                                <div className="w-16 h-16 bg-surfaceAlt rounded-full mb-3 flex items-center justify-center">
                                    <span className="text-2xl font-black text-brand">
                                        {data.brandName ? data.brandName[0].toUpperCase() : "B"}
                                    </span>
                                </div>
                                <h3 className="text-text font-black text-lg text-center leading-tight mb-2">
                                    Thanks for watching!
                                </h3>
                                <p className="text-textMid text-center text-sm font-semibold mb-6">
                                    Click below to visit <span className="text-text font-bold">{data.brandName || "your sponsor"}</span> and unlock your link.
                                </p>
                                <button className="w-full h-12 rounded-[18px] bg-[#6366F1] flex items-center justify-center text-white font-black text-sm shadow-md transition-transform hover:scale-105">
                                    {data.ctaText || "Visit Sponsor"} <MousePointerClick size={16} className="ml-2" />
                                </button>
                                <button className="mt-4 text-textLight text-[11px] font-bold underline">
                                    I don't want to unlock this link
                                </button>
                            </div>
                        )}

                    </div>
                </div>
                <p className="text-[11px] text-[#AAA49C] text-center">
                    This is how your ad will appear to viewers. Actual display may vary by device.
                </p>
            </div>

            {/* Section D - Acknowledgment */}
            <div className="mt-2">
                <button
                    onClick={(e) => { e.preventDefault(); setAcknowledged(!acknowledged); }}
                    className={`w-full min-h-[44px] flex items-start gap-3 p-3 rounded-[10px] text-left transition-colors ${ackError ? "bg-[#FFF0EF] border border-[#C0392B]" : "border border-transparent"} ${shakeAck ? "animate-shake" : ""}`}
                >
                    <div className={`mt-0.5 w-5 h-5 shrink-0 rounded-[6px] flex items-center justify-center transition-colors border ${acknowledged ? "bg-[#6366F1] border-[#6366F1]" : "bg-white border-[#E8E8E8]"}`}>
                        {acknowledged && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-[13px] font-[600] text-[#444] leading-relaxed">
                        I have the right to use this creative and redirect URL. I accept responsibility for my sponsor content. You keep 100% of your sponsorship earnings. AdGate charges no commission on custom sponsor links.
                    </span>
                </button>
                {ackError && (
                    <span className="text-[11px] text-[#C0392B] ml-1 mt-1 block">Please confirm you have rights to this content.</span>
                )}
            </div>

        </div>
    );
}
