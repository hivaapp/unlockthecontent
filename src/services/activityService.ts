
import { supabase } from '../lib/supabase'

export interface Activity {
    id: string;
    type: 'unlock' | 'create';
    title: string;
    time: string;
    timestamp: Date;
    icon: string;
    bg: string;
}

export const getRecentActivity = async (creatorId: string, lastClearedAt?: string): Promise<Activity[]> => {
    try {
        const clearedDate = lastClearedAt ? new Date(lastClearedAt) : null;

        // 1. Fetch recent links created by creator
        let linksQuery = supabase
            .from('links')
            .select('id, title, created_at')
            .eq('creator_id', creatorId);
        
        if (clearedDate) {
            linksQuery = linksQuery.gt('created_at', clearedDate.toISOString());
        }

        const { data: links, error: linksError } = await linksQuery
            .order('created_at', { ascending: false })
            .limit(10);

        if (linksError) throw linksError;

        const linkIds = links?.map(l => l.id) || [];
        
        // 2. Fetch recent email subscribers for these links
        let subQuery = supabase
            .from('email_subscribers')
            .select('id, link_id, subscribed_at, links(title)')
            .eq('creator_id', creatorId);

        if (clearedDate) {
            subQuery = subQuery.gt('subscribed_at', clearedDate.toISOString());
        }

        const { data: subscribers, error: subError } = await subQuery
            .order('subscribed_at', { ascending: false })
            .limit(10);

        if (subError) throw subError;

        // 3. Fetch recent social unlocks for these links
        let socialQuery = supabase
            .from('social_unlocks')
            .select('id, link_id, completed_at, links(title)')
            .in('link_id', linkIds)
            .eq('all_completed', true);

        if (clearedDate) {
            socialQuery = socialQuery.gt('completed_at', clearedDate.toISOString());
        }

        const { data: socialUnlocks, error: socialError } = await socialQuery
            .order('completed_at', { ascending: false })
            .limit(10);

        if (socialError) throw socialError;

        // 4. Fetch recent sponsor impressions (completed)
        let sponsorQuery = supabase
            .from('sponsor_impressions')
            .select('id, link_id, watch_completed_at, links(title)')
            .in('link_id', linkIds)
            .eq('watch_completed', true);

        if (clearedDate) {
            sponsorQuery = sponsorQuery.gt('watch_completed_at', clearedDate.toISOString());
        }

        const { data: sponsorImpressions, error: sponsorError } = await sponsorQuery
            .order('watch_completed_at', { ascending: false })
            .limit(10);

        if (sponsorError) throw sponsorError;

        // Combine and format
        const activityList: Activity[] = [];

        // Add creations
        links?.forEach(link => {
            activityList.push({
                id: `create-${link.id}`,
                type: 'create',
                title: `Created "${link.title}"`,
                time: formatTimeAgo(new Date(link.created_at)),
                timestamp: new Date(link.created_at),
                icon: '🔗',
                bg: 'bg-surfaceAlt'
            });
        });

        // Add email unlocks
        subscribers?.forEach(sub => {
            const linkTitle = (sub.links as any)?.title || 'resource';
            activityList.push({
                id: `unlock-email-${sub.id}`,
                type: 'unlock',
                title: `"${linkTitle}" unlocked via Email`,
                time: formatTimeAgo(new Date(sub.subscribed_at)),
                timestamp: new Date(sub.subscribed_at),
                icon: '🔓',
                bg: 'bg-brand/10'
            });
        });

        // Add social unlocks
        socialUnlocks?.forEach(unlock => {
            const linkTitle = (unlock.links as any)?.title || 'resource';
            activityList.push({
                id: `unlock-social-${unlock.id}`,
                type: 'unlock',
                title: `"${linkTitle}" unlocked via Social`,
                time: formatTimeAgo(new Date(unlock.completed_at)),
                timestamp: new Date(unlock.completed_at),
                icon: '🔓',
                bg: 'bg-brand/10'
            });
        });

        // Add sponsor unlocks
        sponsorImpressions?.forEach(imp => {
            const linkTitle = (imp.links as any)?.title || 'resource';
            activityList.push({
                id: `unlock-sponsor-${imp.id}`,
                type: 'unlock',
                title: `"${linkTitle}" unlocked via Sponsor`,
                time: formatTimeAgo(new Date(imp.watch_completed_at!)),
                timestamp: new Date(imp.watch_completed_at!),
                icon: '🔓',
                bg: 'bg-brand/10'
            });
        });

        // Sort by timestamp and take recent 10
        return activityList
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);

    } catch (err) {
        console.error('Error fetching activity:', err);
        return [];
    }
};

const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    
    return "just now";
};

export const clearActivity = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ last_activity_cleared_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error clearing activity:', err);
        throw err;
    }
};
