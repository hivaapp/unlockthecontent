export type SocialPlatformId = 
  | 'instagram' 
  | 'youtube' 
  | 'twitter' 
  | 'threads' 
  | 'tiktok' 
  | 'linkedin' 
  | 'twitch' 
  | 'discord' 
  | 'telegram';

export interface ValidationResult {
  isValid: boolean;
  handle: string;
  profileUrl: string;
  error?: string;
}

const PLATFORM_PATTERNS: Record<string, { pattern: RegExp; baseUrl: string; prefix?: string }> = {
  instagram: {
    pattern: /instagram\.com\/([a-zA-Z0-9._]+)/i,
    baseUrl: 'https://instagram.com/',
  },
  twitter: {
    pattern: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i,
    baseUrl: 'https://x.com/',
  },
  tiktok: {
    pattern: /tiktok\.com\/@([a-zA-Z0-9._]+)/i,
    baseUrl: 'https://tiktok.com/@',
  },
  youtube: {
    pattern: /youtube\.com\/(?:@|c\/|channel\/|user\/)?([a-zA-Z0-9._-]+)/i,
    baseUrl: 'https://youtube.com/@',
  },
  threads: {
    pattern: /threads\.net\/@([a-zA-Z0-9._]+)/i,
    baseUrl: 'https://threads.net/@',
  },
  linkedin: {
    pattern: /linkedin\.com\/in\/([a-zA-Z0-9._-]+)/i,
    baseUrl: 'https://linkedin.com/in/',
  },
  twitch: {
    pattern: /twitch\.tv\/([a-zA-Z0-9_]+)/i,
    baseUrl: 'https://twitch.tv/',
  },
  discord: {
    pattern: /(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9-_]+)/i,
    baseUrl: 'https://discord.gg/',
  },
  telegram: {
    pattern: /(?:t\.me|telegram\.me)\/([a-zA-Z0-9._]+)/i,
    baseUrl: 'https://t.me/',
  },
};

export const validateSocialInput = (platform: string, input: string): ValidationResult => {
  if (!input) {
    return { isValid: false, handle: '', profileUrl: '', error: 'Input is required' };
  }

  const trimmed = input.trim();
  
  // If it's a full URL
  if (trimmed.startsWith('http')) {
    const pData = PLATFORM_PATTERNS[platform];
    if (pData) {
      const match = trimmed.match(pData.pattern);
      if (match && match[1]) {
        const handle = match[1];
        return {
          isValid: true,
          handle,
          profileUrl: pData.baseUrl + handle,
        };
      } else {
        return {
          isValid: false,
          handle: '',
          profileUrl: '',
          error: `Invalid ${platform} URL`,
        };
      }
    }
  }

  // If it's just a handle
  const cleanHandle = trimmed.replace(/^@/, '');
  
  // Basic handle validation (most platforms allow Alphanumeric + . or _)
  const handleRegex = /^[a-zA-Z0-9._-]+$/;
  if (!handleRegex.test(cleanHandle)) {
    return {
      isValid: false,
      handle: cleanHandle,
      profileUrl: '',
      error: 'Invalid handle format',
    };
  }

  const pData = PLATFORM_PATTERNS[platform];
  if (pData) {
    return {
      isValid: true,
      handle: cleanHandle,
      profileUrl: pData.baseUrl + cleanHandle,
    };
  }

  return {
    isValid: true,
    handle: cleanHandle,
    profileUrl: trimmed, // Fallback
  };
};
