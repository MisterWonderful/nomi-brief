export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  coverImage?: string;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: Date;
  isRead: boolean;
  isFavorite: boolean;
  isPublished: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkEntry {
  id: string;
  title: string;
  url: string;
  description?: string;
  image?: string;
  source?: string;
  sourceUrl?: string;
  isRead: boolean;
  isFavorite: boolean;
  tags: string[];
  category?: string;
  userId: string;
  articleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceSession {
  id: string;
  articleId?: string;
  context?: string;
  summary?: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  status: "active" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id: string;
  userId: string;
  theme: "dark" | "light";
  openclawUrl?: string;
  openclawToken?: string;
  voiceEnabled: boolean;
  notifications: boolean;
  dailyBriefTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyBrief {
  id: string;
  date: Date;
  title: string;
  summary?: string;
  articleCount: number;
  linkCount: number;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
