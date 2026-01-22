export interface ChatMessage {
    id?: number;
    senderEmail: string;
    senderName?: string;
    content: string;
    roomId: number;
    createdAt: string;
    type: "TALK" | "IMAGE" | "POLL" | "BILL" | "LOCATION" | "NOTICE";
    unreadCount?: number;
    metadata?: any;
}

export interface ChatRoomInfo {
  roomId: number;
  roomName: string;
  participantCount: number;
  notice?: string;
}

interface BillData {
    totalAmount: number;    // 총 금액
    participantCount: number; // 정산 참여 인원 수 [새로 추가]
    account: string;        // 입금 계좌
    amountPerPerson: number; // 1인당 금액 (계산된 값)
}