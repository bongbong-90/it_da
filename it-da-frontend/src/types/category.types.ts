export type CategoryType =
    | '스포츠'
    | '맛집'
    | '카페'
    | '문화예술'
    | '스터디'
    | '취미활동'
    | '소셜';

export interface Subcategory {
    name: string;
    icon: string;
    description: string;
    meetings: number;
    members: number;
    popular?: boolean;
}

export interface CategoryStats {
    meetings: number;
    members: string;
    rating: number;
}

export interface Category {
    icon: string;
    name: CategoryType;
    description: string;
    subcategories: Subcategory[];
    stats: CategoryStats;
}

export interface CategoryDetail {
    subcategories: string[];
    location_type: 'indoor' | 'outdoor';
    cost_range: [number, number];
    vibes: string[];
    time_slots: string[];
    max_participants_range: [number, number];
}

// 모임 카드 타입
export interface MeetingCard {
    id: number;
    icon: string;
    category: CategoryType;
    subcategory?: string;
    title: string;
    description: string;
    location: string;
    time: string;
    participants: string;
    maxParticipants: number;
    currentParticipants: number;
}