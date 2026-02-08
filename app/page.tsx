'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    ScanBarcode, Library as LibraryIcon, BookOpen, Plus, ChevronRight, 
    Check, Settings, Trash2, UserPlus, LogOut, Activity,
    BarChart3, StickyNote, Mail, Loader2, Edit3, TrendingUp,
    ShieldCheck, ArrowRight, Gift, Share2, Tag, Sparkles, Star, Clock
  } from 'lucide-react';  
import AddBookModal, { GoogleBook } from '@/components/AddBookModal';
import BookDetailModal from '@/components/BookDetailModal';
import GoalAdjustmentModal from '@/components/GoalAdjustmentModal';
import PinModal from '@/components/PinModal';
import AddChildModal from '@/components/AddChildModal';
import AvatarModal from '@/components/AvatarModal';
import OnboardingWizard from '@/components/OnboardingWizard'; 
import DiscoverModal from '@/components/DiscoverModal'; 
import { supabase } from '@/lib/supabaseClient';

// --- TYPES ---
type Tab = 'library' | 'home' | 'history';

interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  ownership_status: 'owned' | 'borrowed'; 
  in_wishlist: boolean;                   
  rating: number;                         
  memo: string | null;                    
  shelves?: string[]; 
  created_at?: string;
}

interface ReadingLog {
  id: string;
  user_id: string;
  book_title: string;
  book_author: string;
  reader_name: string;
  timestamp: string;
  count?: number; 
  notes?: string; 
}

interface DisplayItem {
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

// --- HELPERS ---
const isToday = (isoString?: string) => {
    if (!isoString) return false;
    const date = new Date(isoString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const isYesterday = (isoString?: string) => {
    if (!isoString) return false;
    const date = new Date(isoString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
};

const isEarlierThisWeek = (isoString?: string) => {
    if (!isoString) return false;
    if (isToday(isoString) || isYesterday(isoString)) return false;
    const date = new Date(isoString);
    const now = new Date();
    const day = now.getDay(); 
    const diff = day === 0 ? 6 : day - 1; 
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0,0,0,0);
    return date >= monday && date <= now;
};

const isThisWeek = (isoString?: string) => {
    if (!isoString) return false;
    const date = new Date(isoString);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= oneWeekAgo && date <= now;
};

const getLastName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return parts.length > 0 ? parts[parts.length - 1] : fullName;
};

const getAvatarUrl = (name: string, map: Record<string, string>) => {
    if (!name) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'; 
    if (map[name]) return `/avatars/${map[name]}`;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
};

const LandingPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) setError(error.message);
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setError(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <img src="/icon.png" alt="Lello Logo" className="w-10 h-10 rounded-xl shadow-sm border border-slate-100" />
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900">Lello</span>
                </div>
            </nav>
            <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase tracking-widest mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Beta Access Open
                </div>
                <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
                    Capture every chapter <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">of their childhood.</span>
                </h1>
                <p className="text-lg text-slate-500 font-medium mb-10 max-w-xl leading-relaxed">
                    From their first picture book to their first novel. Track the journey, celebrate the milestones, and foster a love for learning.
                </p>
                <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex gap-4 mb-6 p-1 bg-slate-50 rounded-xl">
                        <button onClick={() => setIsSignUp(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Log In</button>
                        <button onClick={() => setIsSignUp(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Sign Up</button>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-3">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input type="email" placeholder="name@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input type="password" placeholder="Password" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                        </div>
                        {error && (<div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2"><Activity size={14} /> {error}</div>)}
                        <button disabled={loading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Create Account' : 'Welcome Back')} 
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

const ReadingChart = ({ data }: { data: { day: string, count: number, isToday: boolean }[] }) => {
    const max = Math.max(...data.map(d => d.count), 4); 
    return (
        <div className="w-full h-56 bg-slate-900 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-xl mb-8 overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">This Week</p>
                    <p className="text-white font-bold text-xl">Weekly Count</p>
                </div>
                <div className="p-2 bg-slate-800 rounded-full text-emerald-400">
                    <BarChart3 size={20} />
                </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-full pb-2 px-2">
                {data.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-full relative group flex items-end justify-center h-24">
                            <div 
                                style={{ height: `${(item.count / max) * 100}%` }} 
                                className={`w-full max-w-[12px] rounded-full transition-all duration-500 min-h-[4px] ${item.isToday ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-slate-700 group-hover:bg-slate-600'}`} 
                            />
                            {item.count > 0 && (
                                <div className="absolute -top-8 bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-md">
                                    {item.count}
                                </div>
                            )}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${item.isToday ? 'text-white' : 'text-slate-500'}`}>
                            {item.day}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN APP ---
export default function Home() {
  // Global State
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showReaderMenu, setShowReaderMenu] = useState(false);
  
  const [activeReader, setActiveReader] = useState(''); 
  const [readers, setReaders] = useState(['Leo', 'Maya', 'Parents']);
  const [readerGoals, setReaderGoals] = useState<Record<string, { daily: number, weekly: number }>>({});
  const [readerAvatars, setReaderAvatars] = useState<Record<string, string>>({});

  const [library, setLibrary] = useState<Book[]>([]); 
  const [logs, setLogs] = useState<ReadingLog[]>([]);       

  // UI State
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('owned'); 
  const [copied, setCopied] = useState(false);

  // Modals
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<DisplayItem | null>(null);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoalType, setEditingGoalType] = useState<'daily' | 'weekly'>('daily');
  const [isPinModalOpen, setPinModalOpen] = useState(false);
  const [isChildModalOpen, setChildModalOpen] = useState(false);
  const [pendingReaderChange, setPendingReaderChange] = useState<string | null>(null);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false); 
  const [editingAvatarFor, setEditingAvatarFor] = useState<string | null>(null);
  const [isDiscoverOpen, setDiscoverOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      setLoadingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!profile) { setNeedsOnboarding(true); setReaders([]); } else {
          const profileReaders = profile.readers || [];
          setReaders(profileReaders);
          setReaderGoals(profile.goals || {});
          setReaderAvatars(profile.avatars || {}); 
          if (!activeReader && profileReaders.length > 0) setActiveReader(profileReaders[0]);
      }
      const { data: libData } = await supabase.from('library').select('*');
      if (libData) setLibrary(libData as Book[]);
      const { data: logData } = await supabase.from('reading_logs').select('*');
      if (logData) setLogs(logData as ReadingLog[]);
  };

  // FIX: Robust lookup for covers, handles exact matches and simple fuzzy logic
  const getBookCover = (title: string) => {
      if (!title) return null;
      const exact = library.find(b => b.title === title);
      if (exact) return exact.cover_url;
      // Fuzzy fallback
      const fuzzy = library.find(b => b.title.toLowerCase().trim() === title.toLowerCase().trim());
      return fuzzy ? fuzzy.cover_url : null;
  };

  const stats = useMemo(() => {
    const readerLog = logs.filter(item => item.reader_name === activeReader);
    const currentGoals = readerGoals[activeReader] || readerGoals['default'] || { daily: 2, weekly: 10 };
    const dailyCount = readerLog.filter(item => isToday(item.timestamp)).length; 
    const weeklyCount = readerLog.filter(item => isThisWeek(item.timestamp)).length;
    const lifetimeCount = readerLog.length;
    return { dailyCount, weeklyCount, lifetimeCount, readerLog, goals: currentGoals };
  }, [logs, activeReader, readerGoals]);

  const uniqueShelves = useMemo(() => {
      const shelves = new Set<string>();
      library.forEach(book => {
          if (book.shelves) book.shelves.forEach(s => shelves.add(s));
      });
      return Array.from(shelves).sort();
  }, [library]);

  const chartData = useMemo(() => {
      const days = [];
      const now = new Date();
      const currentDay = now.getDay(); 
      const diff = currentDay === 0 ? 6 : currentDay - 1; 
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
          let count = 0;
          if (d <= now) {
              count = logs.filter(item => { const itemDate = new Date(item.timestamp); return item.reader_name === activeReader && itemDate.getDate() === d.getDate() && itemDate.getMonth() === d.getMonth(); }).length;
          }
          days.push({ day: dayName, count, isToday: d.getDate() === now.getDate() && d.getMonth() === now.getMonth() }); 
      } 
      return days; 
  }, [logs, activeReader]);

  const groupedHistory = useMemo(() => { 
      const groups: { today: any[], yesterday: any[], week: any[], older: any[] } = { today: [], yesterday: [], week: [], older: [] };
      const sortedLog = [...stats.readerLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const aggregated: Record<string, any> = {};
      
      sortedLog.forEach(item => {
          const dateKey = new Date(item.timestamp).toLocaleDateString();
          const key = `${dateKey}-${item.book_title}`;
          if (!aggregated[key]) {
              const libBook = library.find(b => b.title === item.book_title);
              aggregated[key] = { 
                  id: item.id, 
                  title: item.book_title, 
                  author: item.book_author, 
                  cover: getBookCover(item.book_title), 
                  dailyCount: 0, 
                  timestamp: item.timestamp, 
                  reader: item.reader_name, 
                  notes: item.notes,
                  ownershipStatus: libBook ? libBook.ownership_status : 'wishlist',
                  shelves: libBook ? libBook.shelves : [] 
              };
          }
          aggregated[key].dailyCount += 1;
      });
      
      Object.values(aggregated).forEach((item: any) => {
          if (isToday(item.timestamp)) groups.today.push(item);
          else if (isYesterday(item.timestamp)) groups.yesterday.push(item);
          else if (isEarlierThisWeek(item.timestamp)) groups.week.push(item);
          else groups.older.push(item);
      });
      return groups;
  }, [stats.readerLog, library]); // Removed getBookCover from dependencies as it's a function

  // --- Handlers ---
  const handleReaderChangeRequest = (name: string) => {
      setShowReaderMenu(false);
      const isParent = readers.length > 0 && name === readers[readers.length - 1];
      if (isParent || name === 'Parents') { setPendingReaderChange(name); setPinModalOpen(true); } 
      else { setActiveReader(name); }
  };
  const onPinSuccess = () => { setPinModalOpen(false); if (pendingReaderChange) { setActiveReader(pendingReaderChange); setPendingReaderChange(null); }};
  const handleAddChildClick = () => setChildModalOpen(true);
  const handleSaveChild = async (name: string, avatar: string | null) => {
      if (!readers.includes(name)) {
          const parentName = readers.length > 0 ? readers[readers.length - 1] : 'Parents';
          const kids = readers.slice(0, -1);
          const newReaders = [...kids, name, parentName];
          const newGoals = { ...readerGoals, [name]: { daily: 2, weekly: 10 } };
          const newAvatars = { ...readerAvatars };
          if (avatar) newAvatars[name] = avatar;
          await supabase.from('profiles').update({ readers: newReaders, goals: newGoals, avatars: newAvatars }).eq('id', session.user.id);
          setReaders(newReaders); setReaderGoals(newGoals); setReaderAvatars(newAvatars);
      }
  };
  const handleDeleteChild = async (name: string) => { if (confirm(`Remove ${name}?`)) { const newReaders = readers.filter(r => r !== name); await supabase.from('profiles').update({ readers: newReaders }).eq('id', session.user.id); setReaders(newReaders); }};
  const handleResetApp = async () => { if (confirm("WARNING: Delete all data? This cannot be undone.")) { window.location.reload(); } };
  const handleUpdateChildGoal = async (child: string, type: 'daily' | 'weekly', value: number) => { const newGoals = { ...readerGoals, [child]: { ...(readerGoals[child] || readerGoals['default']), [type]: value } }; setReaderGoals(newGoals); await supabase.from('profiles').update({ goals: newGoals }).eq('id', session.user.id); };
  const handleGoalSave = (newGoal: number) => handleUpdateChildGoal(activeReader, editingGoalType, newGoal);
  const handleLogout = async () => { await supabase.auth.signOut(); };
  const handleOpenAvatarModal = (name: string) => { setEditingAvatarFor(name); setAvatarModalOpen(true); };
  const handleSaveAvatar = async (newAvatar: string) => { if (!editingAvatarFor) return; const newAvatars = { ...readerAvatars, [editingAvatarFor]: newAvatar }; setReaderAvatars(newAvatars); await supabase.from('profiles').update({ avatars: newAvatars }).eq('id', session.user.id); };

  // --- FIXED: ADD BOOK LOGIC (Optimistic Updates) ---
  const handleAddBook = async (book: GoogleBook, selectedReaders: string[], status: 'owned' | 'wishlist', shouldLog: boolean, note: string) => {
    setAddModalOpen(false); 
    if (!session) return;
    
    const isWishlist = status === 'wishlist';
    const timestamp = new Date().toISOString();
    // Use a temp ID for optimistic UI
    const tempId = `temp-${Date.now()}`;

    // 1. OPTIMISTIC UPDATE: Add to Library State immediately
    const optimisticBook: Book = { 
        id: tempId,
        user_id: session.user.id,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl, 
        ownership_status: isWishlist ? 'owned' : (status as 'owned' | 'borrowed'), 
        in_wishlist: isWishlist,
        rating: 0,
        memo: '',
        shelves: [],
        created_at: timestamp
    };
    setLibrary(prev => [optimisticBook, ...prev]);

    // 2. OPTIMISTIC UPDATE: Add to Logs State immediately if needed
    if (!isWishlist && shouldLog) {
        const readersToAdd = selectedReaders.length > 0 ? selectedReaders : [activeReader];
        const newOptimisticLogs = readersToAdd.map((reader, idx) => ({ 
            id: `temp-log-${Date.now()}-${idx}`,
            user_id: session.user.id, 
            book_title: book.title, 
            book_author: book.author, 
            reader_name: reader, 
            timestamp: timestamp, 
            notes: note || undefined 
        }));
        setLogs(prev => [...newOptimisticLogs, ...prev]);
    }

    // 3. BACKGROUND: Insert to DB
    const newBookPayload = { 
        user_id: session.user.id, 
        title: book.title, 
        author: book.author, 
        cover_url: book.coverUrl, 
        ownership_status: isWishlist ? 'owned' : status, 
        in_wishlist: isWishlist,
        rating: 0,
        memo: '',
        shelves: []
    };

    const { data: insertedBook, error } = await supabase.from('library').insert(newBookPayload).select().single();
    
    // 4. RECONCILE: If DB insert succeeds, swap temp ID with real ID
    if (insertedBook) {
        setLibrary(prev => prev.map(b => b.id === tempId ? (insertedBook as Book) : b));
    } else if (error) {
        console.error("Library Insert Error:", error);
        // Optionally revert state here if strict data integrity is needed
    }

    // 5. BACKGROUND: Insert Logs to DB
    if (!isWishlist && shouldLog) {
        const readersToAdd = selectedReaders.length > 0 ? selectedReaders : [activeReader];
        const newLogs = readersToAdd.map(reader => ({ 
            user_id: session.user.id, 
            book_title: book.title, 
            book_author: book.author, 
            reader_name: reader, 
            timestamp: timestamp, 
            notes: note || null 
        }));
        
        const { data: insertedLogs } = await supabase.from('reading_logs').insert(newLogs).select();
        // We already updated logs optimistically, so usually we don't need to do anything here
        // unless we want to swap IDs for delete/edit functionality later.
        if (insertedLogs) {
             // Optional: Update IDs if you need them for deletion later in the same session
        }
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent, book: DisplayItem) => { 
      e.stopPropagation(); 
      if (!session) return; 
      
      const timestamp = new Date().toISOString();
      const newLog = { 
          user_id: session.user.id, 
          book_title: book.title, 
          book_author: book.author, 
          reader_name: activeReader, 
          timestamp: timestamp 
      };

      // Optimistic Update
      const optimisticLog: ReadingLog = { ...newLog, id: `temp-${Date.now()}` };
      setLogs(prev => [optimisticLog, ...prev]);

      const { data } = await supabase.from('reading_logs').insert(newLog).select().single(); 
      if (data) {
          // Swap ID
          setLogs(prev => prev.map(l => l.id === optimisticLog.id ? (data as ReadingLog) : l));
      }
  };

  const handleReadAgain = async (book: any) => { 
      if (!session) return; 
      const title = book.title || book.book_title; 
      const author = book.author || book.book_author; 
      const timestamp = new Date().toISOString();

      const newLog = { 
          user_id: session.user.id, 
          book_title: title, 
          book_author: author, 
          reader_name: activeReader, 
          timestamp: timestamp
      };

      // Optimistic
      const optimisticLog: ReadingLog = { ...newLog, id: `temp-${Date.now()}` };
      setLogs(prev => [optimisticLog, ...prev]);
      setSelectedBook((prev) => prev ? ({ ...prev, count: (prev.count || 0) + 1 }) : null);

      const { data } = await supabase.from('reading_logs').insert(newLog).select().single(); 
      if (data) {
          setLogs(prev => prev.map(l => l.id === optimisticLog.id ? (data as ReadingLog) : l));
      }
  };

  const handleRemoveBook = async (id: number | string) => { 
      // Optimistic Delete
      setLogs(prev => prev.filter(i => i.id !== id)); 
      setSelectedBook(null); 
      // Background DB
      await supabase.from('reading_logs').delete().eq('id', id); 
  };

  const handleDeleteAsset = async (title: string) => { 
      if (!session) return; 
      // Optimistic Delete
      setLibrary(prev => prev.filter(b => b.title !== title)); 
      setSelectedBook(null); 
      // Background DB
      await supabase.from('library').delete().eq('title', title).eq('user_id', session.user.id); 
  };
  
  const handleUpdateStatus = async (id: string, newStatus: 'owned' | 'borrowed') => { 
      // Optimistic
      setLibrary(prev => prev.map(b => b.id === id ? { ...b, ownership_status: newStatus } : b)); 
      setSelectedBook((prev) => prev ? ({ ...prev, ownershipStatus: newStatus }) : null); 
      // DB
      await supabase.from('library').update({ ownership_status: newStatus }).eq('id', id); 
  };

  const handleUpdateWishlist = async (id: string, inWishlist: boolean) => {
      // Optimistic
      setLibrary(prev => prev.map(b => b.id === id ? { ...b, in_wishlist: inWishlist } : b));
      setSelectedBook(prev => prev ? { ...prev, inWishlist: inWishlist } : null);
      // DB
      await supabase.from('library').update({ in_wishlist: inWishlist }).eq('id', id);
  };

  const handleUpdateRating = async (id: string, rating: number) => {
      setLibrary(prev => prev.map(b => b.id === id ? { ...b, rating } : b));
      setSelectedBook(prev => prev ? { ...prev, rating } : null);
      await supabase.from('library').update({ rating }).eq('id', id);
  };

  const handleUpdateMemo = async (id: string, memo: string) => {
      setLibrary(prev => prev.map(b => b.id === id ? { ...b, memo } : b));
      setSelectedBook(prev => prev ? { ...prev, memo } : null);
      await supabase.from('library').update({ memo }).eq('id', id);
  };

  const handleUpdateShelves = async (id: string | number, newShelves: string[]) => {
      if (!selectedBook) return; 
      const libBook = library.find(b => b.title === selectedBook.title);
      if (libBook) {
          // Optimistic
          setLibrary(prev => prev.map(b => b.id === libBook.id ? { ...b, shelves: newShelves } : b));
          setSelectedBook(prev => prev ? { ...prev, shelves: newShelves } : null);
          // DB
          await supabase.from('library').update({ shelves: newShelves }).eq('id', libBook.id);
      }
  };

  const handleDiscoverAdd = async (title: string, author: string, status: 'owned' | 'wishlist') => {
      if (!session) return;
      const isWishlist = status === 'wishlist';
      
      // Optimistic
      const tempId = `temp-${Date.now()}`;
      const optimisticBook: Book = {
          id: tempId,
          user_id: session.user.id,
          title,
          author,
          cover_url: null,
          ownership_status: 'owned',
          in_wishlist: isWishlist,
          rating: 0,
          memo: '',
          shelves: [],
          created_at: new Date().toISOString()
      };
      setLibrary(prev => [optimisticBook, ...prev]);

      const { data } = await supabase.from('library').insert({
          user_id: session.user.id,
          title,
          author,
          ownership_status: isWishlist ? 'owned' : 'owned', 
          in_wishlist: isWishlist,
          rating: 0,
          memo: ''
      }).select().single();
      
      if (data) {
          setLibrary(prev => prev.map(b => b.id === tempId ? (data as Book) : b));
      }
  };

  const handleShareRegistry = () => {
      const url = `${window.location.origin}/registry/${session.user.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const selectedBookHistory = useMemo(() => { 
      if (!selectedBook) return []; 
      return logs.filter(l => l.book_title === selectedBook.title).map(l => ({ 
            id: l.id, title: l.book_title, author: l.book_author, reader: l.reader_name, timestamp: l.timestamp, notes: l.notes 
        } as any)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 
  }, [selectedBook, logs]);

  // --- RENDER FUNCTIONS ---
  
  const renderParentDashboard = () => (
      <div className="animate-in fade-in zoom-in-95 duration-300 pb-20">
          <div className="flex items-center gap-4 py-6 mb-4">
             <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Settings size={24} /></div>
             <div><h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Parent's Corner</h1><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Admin Dashboard</p></div>
          </div>
          <div className="space-y-6">
              <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Family Goals & Profiles</h3>
                  <div className="space-y-6">
                      {readers.map(kid => (
                          <div key={kid} className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                              <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                      <button onClick={() => handleOpenAvatarModal(kid)} className="relative group"><img src={getAvatarUrl(kid, readerAvatars)} className="w-10 h-10 rounded-full bg-white shadow-sm object-cover" /><div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={12} className="text-white" /></div></button>
                                      <span className="font-bold text-slate-900 text-lg">{kid}</span>
                                  </div>
                                  {readers.length > 0 && kid !== readers[readers.length - 1] && <button onClick={() => handleDeleteChild(kid)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><Trash2 size={18} /></button>}
                              </div>
                              {readers.length > 0 && kid !== readers[readers.length - 1] && (<div className="space-y-3 pl-14"><div><div className="flex justify-between text-xs font-bold text-slate-400 mb-1"><span>DAILY GOAL</span><span className="text-slate-900">{(readerGoals[kid] || readerGoals['default']).daily} books</span></div><input type="range" min="1" max="10" value={(readerGoals[kid] || readerGoals['default']).daily} onChange={(e) => handleUpdateChildGoal(kid, 'daily', parseInt(e.target.value))} className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" /></div><div><div className="flex justify-between text-xs font-bold text-slate-400 mb-1"><span>WEEKLY GOAL</span><span className="text-slate-900">{(readerGoals[kid] || readerGoals['default']).weekly} books</span></div><input type="range" min="5" max="50" step="1" value={(readerGoals[kid] || readerGoals['default']).weekly} onChange={(e) => handleUpdateChildGoal(kid, 'weekly', parseInt(e.target.value))} className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" /></div></div>)}
                          </div>
                      ))}
                      <button onClick={handleAddChildClick} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-slate-400 hover:text-slate-600 transition-all active:scale-95"><UserPlus size={18} /><span>Add Child</span></button>
                  </div>
              </section>
              <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">System</h3>
                  <button onClick={handleResetApp} className="w-full py-3 bg-red-50 text-red-500 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors">Factory Reset App</button>
                  <button onClick={handleLogout} className="w-full py-3 bg-slate-100 text-slate-900 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors mt-2">Log Out</button>
              </section>
              <button onClick={() => setActiveReader(readers[0] || 'Leo')} className="w-full py-4 bg-slate-900 text-white font-bold rounded-[2rem] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"><LogOut size={18} /><span>Exit Parent Mode</span></button>
          </div>
      </div>
  );

  const renderHomeView = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <section className="flex flex-col items-center justify-center py-12">
          {/* CHANGED: Label and Value for Lifetime Reads */}
          <h2 className="text-[10px] font-extrabold tracking-[0.2em] text-slate-400 uppercase mb-2">{activeReader}'s Lifetime Reads</h2>
          <div className="font-mono-tabular text-9xl font-extrabold text-slate-900 tracking-tighter transition-all">{stats.lifetimeCount}</div>
      </section>
      <section className="space-y-8">
        <div>
          <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Heavy Rotation</h3>
          <div className="grid grid-cols-3 gap-3">
             {Object.values(stats.readerLog.reduce((acc: any, item) => {
                 const key = item.book_title;
                 if (!acc[key]) {
                     acc[key] = { 
                         id: item.id,
                         title: item.book_title,
                         author: item.book_author,
                         count: 0, 
                         cover: getBookCover(item.book_title) 
                     };
                 }
                 acc[key].count++;
                 return acc;
             }, {})).sort((a: any, b: any) => b.count - a.count).slice(0, 3).map((item: any) => (
               <button key={item.id} onClick={() => setSelectedBook(item)} className="relative aspect-[3/4] bg-slate-200 rounded-3xl overflow-hidden border border-slate-300 transition-transform active:scale-[0.98] group">
                 {item.cover ? <img src={item.cover} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><BookOpen size={24} /></div>}
                 <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">{item.count}</div>
               </button>
             ))}
             {stats.readerLog.length === 0 && (<div className="col-span-3 py-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs font-bold">No reading history yet.</div>)}
          </div>
        </div>
      </section>
    </div>
  );

  const renderLibraryView = () => {
    const filters = [
        { id: 'owned', label: 'Library' },
        { id: 'wishlist', label: 'Registry' },
        { id: 'borrowed', label: 'Borrowed' },
        ...uniqueShelves.map(s => ({ id: s, label: s }))
    ];

    // Filter Logic
    const filteredBooks: Book[] = library.filter(book => {
        const safeTitle = (book.title || '').toLowerCase();
        const safeAuthor = (book.author || '').toLowerCase();
        const searchLower = search.toLowerCase();
        const matchesSearch = safeTitle.includes(searchLower) || safeAuthor.includes(searchLower);
        let matchesFilter = false;
        
        if (filter === 'owned') matchesFilter = book.ownership_status === 'owned' || (!book.ownership_status && !book.in_wishlist);
        else if (filter === 'borrowed') matchesFilter = book.ownership_status === 'borrowed';
        else if (filter === 'wishlist') matchesFilter = book.in_wishlist === true;
        else matchesFilter = book.shelves?.includes(filter) || false; 

        return matchesSearch && matchesFilter;
    }).sort((a, b) => (getLastName(a.author || '').localeCompare(getLastName(b.author || ''))));
    
    // Grouping
    const groupedBooks = filteredBooks.reduce((groups, book) => {
        const lastName = getLastName(book.author || 'Unknown');
        const letter = lastName.charAt(0).toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(book);
        return groups;
    }, {} as Record<string, Book[]>);
    
    const sortedKeys = Object.keys(groupedBooks).sort();

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
            <div className="flex justify-between items-center pt-4 mb-4">
                <h1 className="text-4xl font-extrabold tracking-tight">Library</h1>
                {filter === 'wishlist' && (
                    <button 
                        onClick={handleShareRegistry}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2 active:scale-95 transition-all"
                    >
                        {copied ? <Check size={14} /> : <Share2 size={14} />}
                        {copied ? 'Copied!' : 'Share'}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                {filters.map(f => (
                    <button 
                        key={f.id} 
                        onClick={() => setFilter(f.id)} 
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            filter === f.id 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
                <button onClick={() => alert("Create New Shelf: Feature Coming Soon!")} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 shrink-0">
                    <Plus size={16} strokeWidth={3} />
                </button>
            </div>

            <input type="text" placeholder="Search..." className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-4 py-4 mb-4" value={search} onChange={(e) => setSearch(e.target.value)} />
            
            <div className="space-y-8">
                {sortedKeys.map(letter => (
                    <div key={letter}>
                        <h2 className="text-sm font-extrabold text-slate-400 mb-4 px-2 sticky top-20">{letter}</h2>
                        <div className="space-y-3">
                            {groupedBooks[letter].map((book: Book) => (
                                <button 
                                    key={book.id || `temp-${book.title}`} 
                                    onClick={() => setSelectedBook({ ...book, cover: book.cover_url || undefined, ownershipStatus: book.ownership_status, shelves: book.shelves, inWishlist: book.in_wishlist, rating: book.rating, memo: book.memo || undefined })} 
                                    className="w-full bg-white p-3 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-4 text-left group active:scale-[0.99] transition-transform"
                                >
                                    <div className="w-12 h-16 shrink-0 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-slate-300">
                                        {book.cover_url ? <img src={book.cover_url} className="w-full h-full object-cover" /> : <BookOpen size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 truncate">{book.title}</p>
                                            {/* Rating Stars (Mini) */}
                                            {book.rating > 0 && (
                                                <div className="flex">
                                                    {[...Array(book.rating)].map((_, i) => (
                                                        <Star key={i} size={8} className="text-amber-400 fill-amber-400" />
                                                    ))}
                                                </div>
                                            )}
                                            {/* Tag Badges */}
                                            {book.shelves && book.shelves.length > 0 && (
                                                <div className="flex -space-x-1">
                                                    {book.shelves.slice(0,2).map(s => (
                                                        <div key={s} className="w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-white" />
                                                    ))}
                                                </div>
                                            )}
                                            {filter === 'all' && book.ownership_status === 'borrowed' && (<div className="px-1.5 py-0.5 bg-indigo-100 rounded-md"><StickyNote size={10} className="text-indigo-600" /></div>)}
                                            {(filter === 'all' || filter === 'wishlist') && book.in_wishlist && (<div className="px-1.5 py-0.5 bg-orange-100 rounded-md"><Gift size={10} className="text-orange-600" /></div>)}
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium truncate">{book.author}</p>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-200 group-hover:text-slate-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderHistoryView = () => {
    const isDailyGoalMet = stats.dailyCount >= stats.goals.daily;
    const isWeeklyGoalMet = stats.weeklyCount >= stats.goals.weekly;

    const renderBookList = (items: any[], title: string) => (
        <div className="mb-6">
            <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-3 pl-2">{title}</h3>
            <div className="space-y-3">
                {items.map((item: any) => (
                    <div key={item.id} className="w-full bg-white p-4 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm">
                        <button onClick={() => setSelectedBook(item)} className="flex items-center gap-4 flex-1 text-left">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm shrink-0 overflow-hidden">
                                {item.cover ? <img src={item.cover} className="w-full h-full object-cover" /> : <BookOpen size={20} />}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                                <p className="text-xs text-slate-500 font-medium line-clamp-1">{item.author}</p>
                            </div>
                        </button>
                        <div className="flex items-center gap-3">
                            {item.dailyCount > 1 && (<span className="font-mono-tabular font-bold text-slate-400 text-sm">{item.dailyCount}x</span>)}
                            <button onClick={(e) => handleQuickAdd(e, item)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Plus size={18} strokeWidth={3} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h1 className="text-4xl font-extrabold tracking-tight pt-4 mb-6">Activity</h1>
            <ReadingChart data={chartData} />
            <div className="space-y-4 mb-8">
                <button onClick={() => { setEditingGoalType('daily'); setGoalModalOpen(true); }} className={`w-full text-left p-6 rounded-[2.5rem] shadow-sm border transition-all duration-500 relative overflow-hidden active:scale-[0.98] ${isDailyGoalMet ? 'bg-[#008f68] text-white border-transparent shadow-xl shadow-emerald-900/10' : 'bg-white text-slate-900 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-1 relative z-10"><div className="space-y-0.5"><p className={`text-[10px] font-bold uppercase tracking-widest ${isDailyGoalMet ? 'opacity-80' : 'text-slate-400'}`}>Daily Goal</p><p className="text-xl font-bold">{isDailyGoalMet ? 'Goal Achieved! ✨' : `${stats.goals.daily - stats.dailyCount} more to reach target`}</p></div><p className={`font-mono-tabular font-bold text-lg ${isDailyGoalMet ? 'opacity-90' : 'text-slate-400'}`}>{stats.dailyCount}/{stats.goals.daily}</p></div>
                    <div className={`mt-4 h-2 rounded-full overflow-hidden ${isDailyGoalMet ? 'bg-emerald-400/30' : 'bg-slate-100'}`}><div className={`h-full rounded-full transition-all duration-1000 ease-out ${isDailyGoalMet ? 'bg-white' : 'bg-slate-900'}`} style={{ width: `${Math.min((stats.dailyCount / stats.goals.daily) * 100, 100)}%` }} /></div>
                </button>
                <button onClick={() => { setEditingGoalType('weekly'); setGoalModalOpen(true); }} className={`w-full text-left p-6 rounded-[2.5rem] shadow-sm border transition-all duration-500 relative overflow-hidden active:scale-[0.98] ${isWeeklyGoalMet ? 'bg-[#008f68] text-white border-transparent shadow-xl shadow-emerald-900/10' : 'bg-white text-slate-900 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-1 relative z-10"><div className="space-y-0.5"><p className={`text-[10px] font-bold uppercase tracking-widest ${isWeeklyGoalMet ? 'opacity-80' : 'text-slate-400'}`}>Weekly Goal</p><p className="text-xl font-bold">{isWeeklyGoalMet ? 'Weekly Target Met! 🏆' : `${stats.goals.weekly - stats.weeklyCount} more to reach target`}</p></div><p className={`font-mono-tabular font-bold text-slate-400 ${isWeeklyGoalMet ? 'opacity-90' : 'text-slate-400'}`}>{stats.weeklyCount}/{stats.goals.weekly}</p></div>
                    <div className={`mt-4 h-2 rounded-full overflow-hidden ${isWeeklyGoalMet ? 'bg-emerald-400/30' : 'bg-slate-100'}`}><div className={`h-full rounded-full transition-all duration-1000 ease-out ${isWeeklyGoalMet ? 'bg-white' : 'bg-slate-900'}`} style={{ width: `${Math.min((stats.weeklyCount / stats.goals.weekly) * 100, 100)}%` }} /></div>
                </button>
            </div>
            {groupedHistory.today.length > 0 && renderBookList(groupedHistory.today, 'Today')}
            {groupedHistory.yesterday.length > 0 && renderBookList(groupedHistory.yesterday, 'Yesterday')}
            {groupedHistory.week.length > 0 && renderBookList(groupedHistory.week, 'Earlier This Week')}
            {stats.readerLog.length === 0 && (<div className="text-center py-10 text-slate-400 text-sm font-medium">No reading activity yet. Start logging some books!</div>)}
        </div>
    );
  };

  if (loadingSession) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;
  if (!session) return <LandingPage />;
  if (needsOnboarding) return <OnboardingWizard userId={session.user.id} onComplete={() => { setNeedsOnboarding(false); fetchData(session.user.id); }} />;

  return (
    <>
    <div className="flex flex-col min-h-screen pb-32">
      <header className="fixed top-0 left-0 right-0 bg-slate-50/90 backdrop-blur-md z-[100] flex items-center justify-between px-6 py-4">
        {/* Scanner Disabled */}
        <button 
            onClick={() => alert("Scan Barcode to Add to Library: Feature Coming Soon")} 
            className="p-2 hover:bg-slate-100 rounded-2xl active:scale-90"
        >
            <ScanBarcode size={28} className="text-slate-900" />
        </button>
        <div className="flex items-center gap-3">
            <div className="relative">
                <button onClick={() => setShowReaderMenu(!showReaderMenu)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200 active:scale-90 transition-transform">
                    {/* Fixed Avatar Crash by using safe helper */}
                    <img 
                        src={getAvatarUrl(activeReader, readerAvatars)} 
                        className="w-full h-full object-cover bg-orange-100" 
                        alt="Reader Avatar"
                    />
                </button>
                {showReaderMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowReaderMenu(false)} />
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Reader</div>
                    {readers.map(name => (
                        <button key={name} onClick={() => handleReaderChangeRequest(name)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <span className="font-bold text-slate-900">{name}</span>
                        {activeReader === name && <Check size={18} className="text-emerald-500" strokeWidth={3} />}
                        </button>
                    ))}
                    </div>
                </>
                )}
            </div>
        </div>
      </header>
      <main className="mt-20 px-6 max-w-lg mx-auto w-full">
        {readers.length > 0 && activeReader === readers[readers.length-1] ? renderParentDashboard() : (activeTab === 'library' ? renderLibraryView() : activeTab === 'home' ? renderHomeView() : renderHistoryView())}
      </main>
      {readers.length > 0 && activeReader !== readers[readers.length-1] && (<nav className="fixed bottom-0 left-0 right-0 bg-slate-100/90 backdrop-blur-xl border-t border-slate-200 px-12 py-6 flex items-center justify-between z-50 rounded-t-[2.5rem] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]"><button onClick={() => setActiveTab('library')} className={`transition-all ${activeTab === 'library' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><LibraryIcon size={32} strokeWidth={activeTab === 'library' ? 2.5 : 2} /></button><button onClick={() => setActiveTab('home')} className={`transition-all ${activeTab === 'home' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><BookOpen size={32} strokeWidth={activeTab === 'home' ? 2.5 : 2} /></button><button onClick={() => setActiveTab('history')} className={`transition-all ${activeTab === 'history' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}><Activity size={32} strokeWidth={activeTab === 'history' ? 2.5 : 2} /></button></nav>)}
      {readers.length > 0 && activeReader !== readers[readers.length-1] && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center items-center gap-4 z-40 pointer-events-none">
            {/* Standard Add Button */}
            <button 
                onClick={() => setAddModalOpen(true)} 
                className="pointer-events-auto bg-slate-900 text-slate-50 px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2 active:scale-95 transition-transform hover:bg-slate-800"
            >
                <Plus size={20} strokeWidth={3} />
                <span>Add</span>
            </button>
            
            {/* Discover / AI Librarian Button */}
            <button 
                onClick={() => setDiscoverOpen(true)}
                className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform hover:shadow-indigo-500/25"
            >
                <Sparkles size={24} />
            </button>
        </div>
      )}
    </div>
    
    <AddBookModal 
        isOpen={isAddModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        onAdd={handleAddBook} 
        readers={readers.slice(0, -1)} 
        activeReader={activeReader === readers[readers.length-1] ? readers[0] : activeReader}
        initialQuery={''} 
    />
    <BookDetailModal 
        book={selectedBook as any} 
        history={selectedBookHistory} 
        onClose={() => setSelectedBook(null)} 
        onReadAgain={handleReadAgain} 
        onRemove={handleRemoveBook} 
        onDeleteAsset={handleDeleteAsset} 
        onUpdateStatus={handleUpdateStatus} 
        onUpdateWishlist={handleUpdateWishlist} 
        onUpdateRating={handleUpdateRating} 
        onUpdateMemo={handleUpdateMemo} 
        onUpdateShelves={handleUpdateShelves}
    />
    <GoalAdjustmentModal isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} type={editingGoalType} currentGoal={readerGoals[activeReader]?.[editingGoalType] || 3} onSave={handleGoalSave} />
    <PinModal isOpen={isPinModalOpen} onClose={() => setPinModalOpen(false)} onSuccess={onPinSuccess} />
    <AddChildModal isOpen={isChildModalOpen} onClose={() => setChildModalOpen(false)} onAdd={handleSaveChild} existingNames={readers} />
    <AvatarModal isOpen={isAvatarModalOpen} onClose={() => setAvatarModalOpen(false)} onSave={handleSaveAvatar} currentAvatar={editingAvatarFor ? readerAvatars[editingAvatarFor] : null} name={editingAvatarFor || ''} />
    <DiscoverModal 
        isOpen={isDiscoverOpen} 
        onClose={() => setDiscoverOpen(false)} 
        onAddBook={handleDiscoverAdd} 
        userId={session?.user?.id}
    />
    </>
  );
};
