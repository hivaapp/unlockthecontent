// src/services/messageService.ts
import { supabase } from '../lib/supabase';

// Helper for type-safe joins
export interface MessageUser {
  id: string;
  name: string;
  username: string;
  initial: string;
  avatar_color: string;
  trust_score: number;
  is_creator: boolean;
  joinedDate?: string;
}

export const getRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('message_requests')
    .select(`
      *,
      sender:users!message_requests_sender_id_fkey(
        id, name, username, initial, avatar_color, trust_score
      ),
      recipient:users!message_requests_recipient_id_fkey(
        id, name, username, initial, avatar_color, trust_score
      )
    `)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching message requests:', error);
    return [];
  }
  return data;
};

export const createMessageRequest = async (senderId: string, recipientId: string, openingMessage: string) => {
  const { data, error } = await supabase
    .from('message_requests')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      opening_message: openingMessage,
      status: 'pending'
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const updateRequestStatus = async (requestId: string, status: 'approved' | 'declined') => {
  const { data, error } = await supabase
    .from('message_requests')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const getConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('direct_conversations')
    .select(`
      *,
      participant_a:users!direct_conversations_participant_a_id_fkey(
        id, name, username, initial, avatar_color, trust_score
      ),
      participant_b:users!direct_conversations_participant_b_id_fkey(
        id, name, username, initial, avatar_color, trust_score
      )
    `)
    .or(`participant_a_id.eq.${userId},participant_b_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  return data;
};

export const createConversation = async (requestId: string, participantAId: string, participantBId: string) => {
  const { data, error } = await supabase
    .from('direct_conversations')
    .insert({
      request_id: requestId,
      participant_a_id: participantAId,
      participant_b_id: participantBId
    })
    .select(`
      *,
      participant_a:users!direct_conversations_participant_a_id_fkey(id, name, username, initial, avatar_color, trust_score),
      participant_b:users!direct_conversations_participant_b_id_fkey(id, name, username, initial, avatar_color, trust_score)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  isOpeningMessage = false,
  mediaFields?: {
    messageType?: string
    mediaR2Key?: string | null
    mediaThumbnailR2Key?: string | null
    mediaOriginalName?: string | null
    mediaMimeType?: string | null
    mediaSizeBytes?: number | null
    mediaCategory?: string | null
    isProStorage?: boolean
  }
) => {
  const insertData: Record<string, unknown> = {
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    type: 'text',
    is_opening_message: isOpeningMessage,
    message_type: mediaFields?.messageType || 'text',
  }

  // Only include media fields if there's a media attachment
  if (mediaFields?.mediaR2Key) {
    insertData.media_r2_key = mediaFields.mediaR2Key
    insertData.media_thumbnail_r2_key = mediaFields.mediaThumbnailR2Key
    insertData.media_original_name = mediaFields.mediaOriginalName
    insertData.media_mime_type = mediaFields.mediaMimeType
    insertData.media_size_bytes = mediaFields.mediaSizeBytes
    insertData.media_category = mediaFields.mediaCategory
    insertData.is_pro_storage = mediaFields.isProStorage || false
  }

  const { data, error } = await supabase
    .from('direct_messages')
    .insert(insertData)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const getConversationMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching direct messages:', error);
    return [];
  }
  return data;
};

export const markConversationAsRead = async (conversationId: string, unreadField: 'unread_count_a' | 'unread_count_b') => {
  const { error } = await supabase
    .from('direct_conversations')
    .update({ [unreadField]: 0 })
    .eq('id', conversationId);

  if (error) console.error('Error marking conversation read:', error);
};
