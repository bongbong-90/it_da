export interface ChatMessage {
  id?: number;
  roomId: number;
  senderEmail: string;
  senderName: string;
  content: string;
  type: "TEXT" | "IMAGE" | "POLL" | "BILL";
  createdAt: string;
  isRead: boolean;
}

export interface ChatRoomInfo {
  roomId: number;
  roomName: string;
  participantCount: number;
  notice?: string;
}
