// ── Shared types for the Chat module ────────────────────────────

export interface ChatSummary {
    user1Id: string;
    user2Id: string;
    user1: { id: string; name: string; profile: { photoUrl: string | null } | null };
    user2: { id: string; name: string; profile: { photoUrl: string | null } | null };
    messages: { content: string; createdAt: string; senderId: string }[];
    unreadCount: number;
}

export interface Message {
    id: string;
    content: string;
    imageUrl?: string | null;
    senderId: string;
    createdAt: string;
}

export interface Offer {
    id: string;
    description: string;
    price: number;
    estimatedDays: number | null;
    estimatedHours: number | null;
    status: string;
    senderId: string;
    receiverId: string;
    senderApproved: boolean;
    receiverApproved: boolean;
    senderCompleted: boolean;
    receiverCompleted: boolean;
    sender: { id: string; name: string };
    receiver: { id: string; name: string };
    jobPost: { id: string; title: string; authorId: string; status: string };
    createdAt: string;
    reviews?: { authorId: string }[];
}

export const SOCKET_URL =
    import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
