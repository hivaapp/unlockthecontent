// Global type declarations for JS service modules

declare module '*/services/linksService' {
  export function generateSlug(title: string): string;
  export function generateUniqueSlug(title: string): Promise<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getCreatorLinks(creatorId: string): Promise<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getLinkBySlug(slug: string): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getPublicCreatorLinks(creatorId: string): Promise<any[]>;
  export function getExploreLinks(options?: {
    search?: string;
    category?: string;
    unlockType?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<{ links: any[]; total: number; hasMore: boolean }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function searchUsers(query: string, limit?: number): Promise<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createLink(creatorId: string, linkData: any): Promise<{ id: string; slug: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function updateLink(linkId: string, creatorId: string, updates: any): Promise<boolean>;
  export function toggleLinkActive(linkId: string, creatorId: string, isActive: boolean): Promise<boolean>;
  export function deleteLink(linkId: string, creatorId: string): Promise<boolean>;
  export function trackLinkView(linkId: string, sessionKey: string, viewerId?: string | null): Promise<void>;
}

declare module '*/services/profileService' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getCreatorProfile(username: string): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getCreatorStats(creatorId: string): Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function searchPeople(query: string, currentUserId?: string | null): Promise<any[]>;
}

declare module '*/services/uploadService' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const FILE_RULES: Record<string, any>;
  export function validateFile(file: File, bucket?: string): { valid: boolean; error: string | null };
  export function formatFileSize(bytes: number): string;
  export function getFileEmoji(fileName: string, mimeType?: string): string;
  export function uploadFile(file: File, bucket?: string, options?: {
    onProgress?: (percent: number) => void;
    onStageChange?: (stage: string) => void;
    signal?: AbortSignal;
  }): Promise<{ fileId: string; r2Key: string; originalName: string; mimeType: string; sizeBytes: number }>;
  export function getDownloadUrl(params: {
    fileId: string;
    linkSlug: string;
    unlockType: string;
    sessionKey?: string;
    forceDownload?: boolean;
  }): Promise<{ downloadUrl: string; expiresIn: number }>;
  export function deleteFile(fileId: string): Promise<boolean>;
}

declare module '*/hooks/useOptimisticList' {
  export function useOptimisticList<T extends { id: string }>(initialItems?: T[]): {
    items: T[];
    setItems: React.Dispatch<React.SetStateAction<T[]>>;
    updateItem: (id: string, optimisticUpdate: Partial<T>, serverAction: () => Promise<void>) => Promise<void>;
    removeItem: (id: string, serverAction: () => Promise<void>) => Promise<void>;
    pendingIds: Set<string>;
  };
}
