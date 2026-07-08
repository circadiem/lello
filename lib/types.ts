// Shared domain types for the Lello app.

export type Tab = 'library' | 'home' | 'history';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  isbn?: string | null;
  occasion?: string | null;
  purchased_at?: string | null;
  purchased_by?: string | null;
  ownership_status: 'owned' | 'borrowed';
  in_wishlist: boolean;
  rating: number;
  memo: string | null;
  shelves?: string[];
  created_at?: string;
}

export interface ReadingLog {
  id: string;
  user_id: string;
  book_title: string;
  book_author: string;
  reader_name: string;
  timestamp: string;        // null while a chapter book is in progress
  count?: number;
  notes?: string;
  started_at?: string | null; // set for chapter books (start date)
  photo_url?: string | null;  // Reading Memories: attached photo
  quote?: string | null;      // Reading Memories: memorable quote
  read_mode?: string;         // who-read-to-whom: to_child | together | by_child
}

export interface DisplayItem {
  id: string | number;
  title: string;
  author: string;
  cover?: string;
  cover_url?: string | null;
  reader?: string;
  timestamp?: string;
  count?: number;
  // UI Props
  ownershipStatus?: 'owned' | 'borrowed';
  inWishlist?: boolean;
  rating?: number;
  memo?: string;
  shelves?: string[];
  dailyCount?: number;
}
