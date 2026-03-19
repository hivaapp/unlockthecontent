export const getAvatarColor = (name: string) => {
    const colors = ['#D97757', '#417A55', '#C0392B', '#A0622A', '#8e44ad', '#2980b9', '#16a085', '#d35400', '#f39c12', '#2ecc71', '#34495e'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export const formatBytes = (bytes: number, decimals: number = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
export const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    let videoId = '';
    try {
        if (url.includes('youtube.com/watch?v=')) {
            videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1].split('?')[0];
        }
    } catch (e) {
        return null;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};
