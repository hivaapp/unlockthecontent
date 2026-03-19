let contentFile: File | null = null;
let sponsorVideo: File | null = null;
let completionRewardFile: File | null = null;

export const setContentFile = (file: File | null) => {
    contentFile = file;
};

export const getContentFile = (): File | null => {
    return contentFile;
};

export const setSponsorVideo = (file: File | null) => {
    sponsorVideo = file;
};

export const getSponsorVideo = (): File | null => {
    return sponsorVideo;
};

export const setCompletionRewardFile = (file: File | null) => {
    completionRewardFile = file;
};

export const getCompletionRewardFile = (): File | null => {
    return completionRewardFile;
};

export const clearAll = () => {
    contentFile = null;
    sponsorVideo = null;
    completionRewardFile = null;
};
