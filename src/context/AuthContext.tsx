import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { mockActivity } from '../lib/mockData';
import type { User } from '../lib/mockData';
import { recordTrustEvent } from '../services/trustEventService';

export interface LinkData {
    id: string;
    slug?: string;
    title?: string;
    description?: string;
    contentMode?: string;
    textContent?: string;
    links?: { url: string; title: string; }[];
    youtubeUrl?: string | null;
    fileAttachments?: unknown[];
    fileType?: string;
    fileName?: string;
    fileSize?: string;
    donateEnabled?: boolean;
    unlockType?: 'custom_sponsor' | 'email_subscribe' | 'social_follow' | 'follower_pairing';
    emailConfig?: Record<string, unknown> | null;
    socialConfig?: Record<string, unknown> | null;
    followerPairingConfig?: Record<string, unknown> | null;
    isActive?: boolean;
    viewCount?: number;
    unlockCount?: number;
    earned?: number;
    conversionRate?: string;
    createdAt?: string;
    geography?: { country: string; percent: number; }[];
    deviceSplit?: { mobile: number; desktop: number; tablet: number; };
    customAd?: {
        fileName?: string;
        fileSize?: number;
        fileMimeType?: string;
        previewUrl?: string;
        redirectUrl?: string | null;
        requiresClick?: boolean;
        ctaText?: string;
        brandName?: string;
        skipAfter?: number;
        impressions?: number;
        videoWatches?: number;
        clicks?: number;
    } | null;
    [key: string]: unknown;
}

export interface ActivityData {
    id: string;
    type?: string;
    description?: string;
    timestamp?: string;
    earned?: number;
    resourceTitle?: string;
    [key: string]: unknown;
}

type AuthContextType = {
    // State
    session: Session | null;
    isLoggedIn: boolean;
    currentUser: User | null;
    isLoading: boolean;
    isLoggingIn: boolean;

    // Legacy data (still mock for now — will be replaced in later parts)
    activity: ActivityData[];
    activeTab: string;

    // Auth actions
    signUp: (params: { name: string; email: string; password: string; referralCode?: string }) => Promise<{ user: unknown; requiresConfirmation: boolean }>;
    signIn: (params: { email: string; password: string }) => Promise<unknown>;
    signInWithGoogle: () => Promise<void>;
    login: (userData?: Partial<User>) => Promise<void>; // Legacy alias
    logout: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    resendConfirmation: (email: string) => Promise<void>;

    // Profile actions
    updateUser: (updates: Partial<User> & { socialHandles?: Record<string, string | null>; avatarColor?: string }) => Promise<void>;
    updateEmail: (newEmail: string) => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>; // Legacy alias
    refreshProfile: () => Promise<void>;

    setActiveTab: (tab: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // true until first session check completes
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Legacy state — still mock for now
    const [activity, _setActivity] = useState<ActivityData[]>(mockActivity as ActivityData[]);
    const [activeTab, setActiveTab] = useState('home');

    // ── Fetch full user profile from public.users ──────────────────────────
    const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
        const { data, error } = await supabase
            .from('users')
            .select(`
                id,
                email,
                name,
                username,
                bio,
                location,
                website,
                avatar_color,
                initial,
                is_creator,
                is_verified,
                is_pro,
                stripe_connected,
                stripe_customer_id,
                subscription_period_end,
                referral_code,
                active_pairing_links_count,
                trust_score,
                created_at,
                last_activity_cleared_at,
                social_handles (
                    platform,
                    handle,
                    profile_url,
                    sort_order
                )
            `)
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error.message);
            return null;
        }

        // Reshape social handles into the object format the frontend expects
        const socialHandles: Record<string, string | null> = {};
        if (data.social_handles && Array.isArray(data.social_handles)) {
            (data.social_handles as Array<{ platform: string; handle: string; sort_order: number }>)
                .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
                .forEach((h: { platform: string; handle: string }) => {
                    socialHandles[h.platform] = h.handle;
                });
        }

        return {
            id: data.id,
            email: data.email,
            name: data.name || '',
            username: data.username || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || null,
            avatarInitial: data.initial || data.name?.charAt(0)?.toUpperCase() || 'A',
            initial: data.initial || data.name?.charAt(0)?.toUpperCase() || 'A',
            avatarColor: data.avatar_color || '#D97757',
            isCreator: data.is_creator,
            isVerified: data.is_verified,
            isProUser: data.is_pro,
            stripeConnected: data.stripe_connected,
            stripeCustomerId: data.stripe_customer_id,
            subscriptionPeriodEnd: data.subscription_period_end,
            referralCode: data.referral_code,
            trustScore: data.trust_score,
            followerPairingLinkCount: data.active_pairing_links_count,
            socialHandles,
            joinedDate: data.created_at,
            lastActivityClearedAt: data.last_activity_cleared_at,
        };
    }, []);

    // ── Initialize session on mount ────────────────────────────────────────
    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Get current session (reads from localStorage automatically)
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.warn('Auth session error (non-fatal):', error.message);
                }

                if (!mounted) return;

                if (initialSession?.user) {
                    setSession(initialSession);
                    setIsLoggedIn(true);
                    // Fetch profile in background — don't block loading
                    fetchUserProfile(initialSession.user.id).then(profile => {
                        if (mounted && profile) setCurrentUser(profile);
                    }).catch(err => {
                        console.warn('Profile fetch failed (non-fatal):', err.message);
                    });
                }
            } catch (err) {
                console.warn('Auth initialization failed (non-fatal):', err);
            } finally {
                // ALWAYS mark loading as complete, even if auth fails
                if (mounted) setIsLoading(false);
            }
        };

        initializeAuth();

        // Safety timeout — if auth takes longer than 5 seconds, stop loading anyway
        const safetyTimeout = setTimeout(() => {
            if (mounted) setIsLoading(false);
        }, 5000);

        // ── Listen to auth state changes ────────────────────────────────────
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (newSession?.user) {
                        setSession(newSession);
                        setIsLoggedIn(true);
                        // Fetch profile but don't block
                        fetchUserProfile(newSession.user.id).then(profile => {
                            if (mounted && profile) setCurrentUser(profile);
                        }).catch(err => {
                            console.warn('Profile fetch error:', err.message);
                        });
                    }
                }

                if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setCurrentUser(null);
                    setIsLoggedIn(false);
                    // NOTE: Do NOT clear hivaapp_pending_link or pendingFileStore here.
                    // A user may sign out to switch accounts while still having a pending
                    // link they created as a guest. PendingLinkContext owns that data's
                    // lifecycle and will clear it only on successful recovery.
                }

                if (event === 'USER_UPDATED') {
                    if (newSession?.user) {
                        fetchUserProfile(newSession.user.id).then(profile => {
                            if (mounted && profile) setCurrentUser(profile);
                        }).catch(err => {
                            console.warn('Profile refresh error:', err.message);
                        });
                    }
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, [fetchUserProfile]);

    // ── Sign Up ────────────────────────────────────────────────────────────
    const signUp = async ({ name, email, password, referralCode }: { name: string; email: string; password: string; referralCode?: string }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    // Passed to handle_new_user() trigger via raw_user_meta_data
                },
                emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
            },
        });

        if (error) throw error;

        // If a referral code was provided, store it temporarily in localStorage.
        if (referralCode) {
            localStorage.setItem('unlockthecontent_referral_code', referralCode);
        }

        return {
            user: data.user,
            requiresConfirmation: !data.session,
        };
    };

    // ── Sign In With Email ─────────────────────────────────────────────────
    const signIn = async ({ email, password }: { email: string; password: string }) => {
        setIsLoggingIn(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Map Supabase error messages to user-friendly versions
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Incorrect email or password.');
                }
                if (error.message.includes('Email not confirmed')) {
                    throw new Error(
                        'Please confirm your email before signing in. ' +
                        'Check your inbox for the confirmation link.'
                    );
                }
                throw error;
            }

            // onAuthStateChange SIGNED_IN fires automatically and sets state.
            return data;
        } finally {
            setIsLoggingIn(false);
        }
    };

    // ── Sign In With Google ────────────────────────────────────────────────
    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) throw error;
        // Browser redirects to Google — no further action needed here.
    };

    // ── Sign Out ───────────────────────────────────────────────────────────
    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // NOTE: Do NOT clear hivaapp_pending_link here. The user may have created
        // a new link as a guest in the same session and needs it recovered on re-login.
        // PendingLinkContext exclusively manages that data's lifecycle.
        // onAuthStateChange SIGNED_OUT fires and clears auth state.
    };

    // ── Send Password Reset Email ──────────────────────────────────────────
    const sendPasswordReset = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (error) throw error;
    };

    // ── Update User Profile ────────────────────────────────────────────────
    const updateUser = async (updates: Partial<User> & { socialHandles?: Record<string, string | null>; avatarColor?: string }) => {
        if (!currentUser) return;

        const { error } = await supabase
            .from('users')
            .update({
                name: updates.name,
                username: updates.username,
                bio: updates.bio,
                location: updates.location,
                website: updates.website,
                avatar_color: updates.avatarColor,
                updated_at: new Date().toISOString(),
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        // Handle social handles separately — upsert each one
        if (updates.socialHandles) {
            const platforms = Object.entries(updates.socialHandles)
                .filter(([, handle]) => handle)
                .map(([platform, handle], index) => ({
                    user_id: currentUser.id,
                    platform,
                    handle,
                    sort_order: index,
                }));

            // Delete existing and re-insert to handle removals cleanly
            await supabase
                .from('social_handles')
                .delete()
                .eq('user_id', currentUser.id);

            if (platforms.length > 0) {
                await supabase.from('social_handles').insert(platforms);
            }
        }

        // Refresh local state
        const updatedProfile = await fetchUserProfile(currentUser.id);
        if (updatedProfile) {
            setCurrentUser(updatedProfile);

            // Fire profile_completed trust event if all key fields are filled
            const hasName = !!updatedProfile.name?.trim();
            const hasBio = !!updatedProfile.bio?.trim();
            const hasLocation = !!updatedProfile.location?.trim();
            const hasSocials = updatedProfile.socialHandles && Object.values(updatedProfile.socialHandles).some((h: unknown) => !!h);
            if (hasName && hasBio && hasLocation && hasSocials) {
                recordTrustEvent(currentUser.id, 'profile_completed');
            }
        }
    };

    // ── Update Auth Email ──────────────────────────────────────────────────
    const updateEmail = async (newEmail: string) => {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
    };

    // ── Update Password ────────────────────────────────────────────────────
    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    };

    // ── Resend Confirmation Email ──────────────────────────────────────────
    const resendConfirmation = async (email: string) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
            },
        });
        if (error) throw error;
    };

    // ── Refresh Profile ────────────────────────────────────────────────────
    const refreshProfile = async () => {
        if (!session?.user?.id) return;
        const profile = await fetchUserProfile(session.user.id);
        if (profile) setCurrentUser(profile);
    };

    // ── Legacy: updateProfile alias ────────────────────────────────────────
    const updateProfile = async (data: Partial<User>) => {
        await updateUser(data);
    };

    // ── Legacy: login alias for backward compatibility ─────────────────────
    const login = async (userData?: Partial<User>): Promise<void> => {
        // If called with just userData (old mock style), this won't do a real login.
        // Components should migrate to signIn({ email, password }).
        // For now this is a no-op fallback to prevent crashes.
        if (userData) {
            console.warn('AuthContext.login() with userData is deprecated. Use signIn({ email, password }) instead.');
        }
    };



    const value: AuthContextType = {
        // State
        session,
        currentUser,
        isLoggedIn,
        isLoading,
        isLoggingIn,

        // Legacy data
        activity,
        activeTab,

        // Auth actions
        signUp,
        signIn,
        signInWithGoogle,
        login,
        logout,
        sendPasswordReset,
        resendConfirmation,

        // Profile actions
        updateUser,
        updateEmail,
        updatePassword,
        updateProfile,
        refreshProfile,

        setActiveTab,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
