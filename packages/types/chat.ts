export interface ChatMessage {
  type: 'USER' | 'SYSTEM';
  nickname: string;
  message: string;
  timestamp: string; // ISO string
  avatarUrl?: string;
  isMine?: boolean;
}
