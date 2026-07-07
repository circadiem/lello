'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ScanBarcode, Library as LibraryIcon, BookOpen, Plus, ChevronRight,
    Check, Settings, Trash2, UserPlus, LogOut, Activity,
    StickyNote, Loader2, Edit3, TrendingUp,
    ArrowRight, Gift, Share2, Tag, Sparkles, Star, Clock, Wand2, BookMarked
  } from 'lucide-react';
import AddBookModal, { GoogleBook } from '@/components/AddBookModal';
import BookDetailModal from '@/components/BookDetailModal';
import GoalAdjustmentModal from '@/components/GoalAdjustmentModal';
import PinModal from '@/components/PinModal';
import AddChildModal from '@/components/AddChildModal';
import AvatarModal from '@/components/AvatarModal';
import OnboardingWizard from '@/components/OnboardingWizard'; 
import DiscoverModal from '@/components/DiscoverModal';
import BarcodeScanner from '@/components/BarcodeScanner';
import StreakCard from '@/components/StreakCard';
import MilestoneToast, { Milestone } from '@/components/MilestoneToast';
import MagicLogModal from '@/components/MagicLogModal';
import YearInReview from '@/components/YearInReview';
import { supabase } from '@/lib/supabaseClient';
import { getStoredPin, storePin, clearStoredPin, PinRecord } from '@/lib/pin';

import { MILESTONES, OCCASIONS } from '@/lib/constants';
import type { Tab, Book, ReadingLog, DisplayItem } from '@/lib/types';
import {
  isToday, isYesterday, isEarlierThisWeek, isThisWeek,
  getLastName, getAvatarUrl, daysBetween,
} from '@/lib/helpers';

import LandingPage from '@/components/LandingPage';
import ReadingChart from '@/components/ReadingChart';
import BottomNav from '@/components/BottomNav';
import ParentDashboard from '@/components/views/ParentDashboard';

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
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [scanQuery, setScanQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<DisplayItem | null>(null);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoalType, setEditingGoalType] = useState<'daily' | 'weekly'>('daily');
  const [isPinModalOpen, setPinModalOpen] = useState(false);
  const [pinRecord, setPinRecord] = useState<PinRecord | null>(null);
  const [pinIntent, setPinIntent] = useState<'access' | 'change'>('access');
  const [isChildModalOpen, setChildModalOpen] = useState(false);
  const [pendingReaderChange, setPendingReaderChange] = useState<string | null>(null);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false); 
  const [editingAvatarFor, setEditingAvatarFor] = useState<string | null>(null);
  const [isDiscoverOpen, setDiscoverOpen] = useState(false);
  const [isMagicLogOpen, setMagicLogOpen] = useState(false);
  const [showYearReview, setShowYearReview] = useState(false);

  // Lightweight feedback for failed writes + milestone celebrations.
  const [toast, setToast] = useState<string | null>(null);
  const [milestoneToast, setMilestoneToast] = useState<Milestone | null>(null);
  const celebratedInit = useRef<Set<string>>(new Set()); // readers backfilled this session
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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

  // Load this device's saved parent PIN once we know who's signed in.
  useEffect(() => {
    if (session?.user?.id) setPinRecord(getStoredPin(session.user.id));
  }, [session]);

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
    // Completed reads have a timestamp; chapter books still in progress
    // (started_at set, timestamp null) are tracked separately and must not
    // inflate counts/streaks/history.
    const completed = readerLog.filter(item => item.timestamp);
    const currentlyReading = readerLog.filter(item => item.started_at && !item.timestamp);
    const currentGoals = readerGoals[activeReader] || readerGoals['default'] || { daily: 2, weekly: 10 };
    const dailyCount = completed.filter(item => isToday(item.timestamp)).length;
    const weeklyCount = completed.filter(item => isThisWeek(item.timestamp)).length;
    const lifetimeCount = completed.length;
    return { dailyCount, weeklyCount, lifetimeCount, readerLog, completed, currentlyReading, goals: currentGoals };
  }, [logs, activeReader, readerGoals]);

  // Reading streak for the active reader: consecutive calendar days with at
  // least one logged read. `current` counts back from today (still "alive" if
  // they read yesterday but not yet today); `longest` is their all-time best.
  const streak = useMemo(() => {
    const keyFor = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const dayKeys = new Set(stats.completed.map(l => keyFor(new Date(l.timestamp))));

    let current = 0;
    const cursor = new Date();
    if (!dayKeys.has(keyFor(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (dayKeys.has(keyFor(cursor))) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Longest run, stepping day-by-day (DST-safe) over the sorted unique days.
    const days = Array.from(dayKeys)
      .map(k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m, d); })
      .sort((a, b) => a.getTime() - b.getTime());
    let longest = 0, run = 0;
    let prev: Date | null = null;
    for (const d of days) {
      if (prev) {
        const next = new Date(prev);
        next.setDate(next.getDate() + 1);
        run = keyFor(next) === keyFor(d) ? run + 1 : 1;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = d;
    }
    return { current, longest };
  }, [stats.completed]);

  // Milestone unlocks. Progress is kept in localStorage per (user, reader) so
  // each badge only celebrates once. The first computation for a reader this
  // session backfills silently (no retroactive spam for existing achievements).
  useEffect(() => {
    if (!activeReader || !session) return;
    const key = `lello:badges:${session.user.id}:${activeReader}`;
    let stored: string[] = [];
    try { stored = JSON.parse(localStorage.getItem(key) || '[]'); } catch { /* ignore */ }

    const ctx = { lifetime: stats.lifetimeCount, streak: streak.current };
    const unlocked = MILESTONES.filter(m => m.test(ctx)).map(m => m.id);
    const newly = unlocked.filter(id => !stored.includes(id));
    if (newly.length === 0) return;

    try { localStorage.setItem(key, JSON.stringify(unlocked)); } catch { /* ignore */ }

    if (celebratedInit.current.has(activeReader)) {
      const top = MILESTONES.filter(m => newly.includes(m.id)).pop();
      if (top) setMilestoneToast({ id: top.id, label: top.label, emoji: top.emoji });
    } else {
      celebratedInit.current.add(activeReader);
    }
  }, [stats.lifetimeCount, streak.current, activeReader, session]);

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
              count = logs.filter(item => { if (!item.timestamp) return false; const itemDate = new Date(item.timestamp); return item.reader_name === activeReader && itemDate.getDate() === d.getDate() && itemDate.getMonth() === d.getMonth(); }).length;
          }
          days.push({ day: dayName, count, isToday: d.getDate() === now.getDate() && d.getMonth() === now.getMonth() }); 
      } 
      return days; 
  }, [logs, activeReader]);

  const groupedHistory = useMemo(() => { 
      const groups: { today: any[], yesterday: any[], week: any[], older: any[] } = { today: [], yesterday: [], week: [], older: [] };
      const sortedLog = [...stats.completed].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
  }, [stats.completed, library]); // Removed getBookCover from dependencies as it's a function

  // --- Handlers ---
  const handleReaderChangeRequest = (name: string) => {
      setShowReaderMenu(false);
      const isParent = readers.length > 0 && name === readers[readers.length - 1];
      if (isParent || name === 'Parents') { setPinIntent('access'); setPendingReaderChange(name); setPinModalOpen(true); }
      else { setActiveReader(name); }
  };
  // PIN verified (verify mode) → enter the pending parent profile.
  const onPinVerified = () => { setPinModalOpen(false); if (pendingReaderChange) { setActiveReader(pendingReaderChange); setPendingReaderChange(null); }};
  // PIN created/changed (set mode) → save to this device. First-time setup
  // during a parent-access attempt also drops them into parent mode.
  const onPinSet = (hash: string, salt: string) => {
      if (session) storePin(session.user.id, hash, salt);
      setPinRecord({ hash, salt });
      setPinModalOpen(false);
      if (pinIntent === 'access' && pendingReaderChange) { setActiveReader(pendingReaderChange); setPendingReaderChange(null); }
      else { showToast('Parent PIN updated.'); }
  };
  const handleChangePin = () => { setPinIntent('change'); setPinModalOpen(true); };
  const handleForgotPin = async () => {
      if (!session?.user?.email) return;
      const pw = prompt('Enter your account password to reset your PIN:');
      if (!pw) return;
      const { error } = await supabase.auth.signInWithPassword({ email: session.user.email, password: pw });
      if (error) { showToast('Incorrect password.'); return; }
      clearStoredPin(session.user.id);
      setPinRecord(null); // modal re-renders into "set" mode so they pick a new PIN
  };
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
  const handleDeleteChild = async (name: string) => {
      if (!session) return;
      if (!confirm(`Remove ${name}? This also permanently deletes their reading history. This cannot be undone.`)) return;
      const newReaders = readers.filter(r => r !== name);
      const newGoals = { ...readerGoals }; delete newGoals[name];
      const newAvatars = { ...readerAvatars }; delete newAvatars[name];
      // Optimistic local cleanup
      setReaders(newReaders);
      setReaderGoals(newGoals);
      setReaderAvatars(newAvatars);
      setLogs(prev => prev.filter(l => l.reader_name !== name));
      if (activeReader === name) setActiveReader(newReaders[0] || '');
      // Persist: profile + cascade-delete this reader's logs (RLS scopes to user)
      await supabase.from('profiles').update({ readers: newReaders, goals: newGoals, avatars: newAvatars }).eq('id', session.user.id);
      await supabase.from('reading_logs').delete().eq('user_id', session.user.id).eq('reader_name', name);
  };
  const handleResetApp = async () => {
      if (!session) return;
      if (!confirm("WARNING: This permanently deletes your library, all reading history, and family profiles. This cannot be undone.")) return;
      const uid = session.user.id;
      // Wipe data, then the profile (so the next sign-in starts fresh at onboarding).
      await supabase.from('reading_logs').delete().eq('user_id', uid);
      await supabase.from('library').delete().eq('user_id', uid);
      await supabase.from('profiles').delete().eq('id', uid);
      clearStoredPin(uid);
      setPinRecord(null);
      await supabase.auth.signOut();
  };
  const handleUpdateChildGoal = async (child: string, type: 'daily' | 'weekly', value: number) => { const newGoals = { ...readerGoals, [child]: { ...(readerGoals[child] || readerGoals['default']), [type]: value } }; setReaderGoals(newGoals); await supabase.from('profiles').update({ goals: newGoals }).eq('id', session.user.id); };
  const handleGoalSave = (newGoal: number) => handleUpdateChildGoal(activeReader, editingGoalType, newGoal);
  const handleLogout = async () => { await supabase.auth.signOut(); };
  const handleOpenAvatarModal = (name: string) => { setEditingAvatarFor(name); setAvatarModalOpen(true); };
  const handleSaveAvatar = async (newAvatar: string) => { if (!editingAvatarFor) return; const newAvatars = { ...readerAvatars, [editingAvatarFor]: newAvatar }; setReaderAvatars(newAvatars); await supabase.from('profiles').update({ avatars: newAvatars }).eq('id', session.user.id); };

  // --- FIXED: ADD BOOK LOGIC (Optimistic Updates) ---
  const handleAddBook = async (book: GoogleBook, selectedReaders: string[], status: 'owned' | 'borrowed' | 'wishlist', shouldLog: boolean, note: string, readDateIso?: string) => {
    setAddModalOpen(false);
    if (!session) return;

    // Duplicate guard: same ISBN, or same title+author (case-insensitive).
    const dupe = library.find(b =>
        (book.isbn && b.isbn && b.isbn === book.isbn) ||
        (b.title.trim().toLowerCase() === book.title.trim().toLowerCase() &&
         (b.author || '').trim().toLowerCase() === (book.author || '').trim().toLowerCase())
    );
    if (dupe) {
        const addAnyway = confirm(
            `"${book.title}" is already in your library. Add another copy anyway?\n\n(Tip: open the book from your Library to log a read instead.)`
        );
        if (!addAnyway) return;
    }

    const isWishlist = status === 'wishlist';
    const timestamp = readDateIso || new Date().toISOString();
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
    const readersToAdd = selectedReaders.length > 0 ? selectedReaders : [activeReader];
    const optimisticLogIds: string[] = [];
    if (!isWishlist && shouldLog) {
        const newOptimisticLogs = readersToAdd.map((reader, idx) => {
            const id = `temp-log-${Date.now()}-${idx}`;
            optimisticLogIds.push(id);
            return {
                id,
                user_id: session.user.id,
                book_title: book.title,
                book_author: book.author,
                reader_name: reader,
                timestamp,
                notes: note || undefined,
            };
        });
        setLogs(prev => [...newOptimisticLogs, ...prev]);
    }

    // 3. BACKGROUND: Insert to DB
    const newBookPayload = {
        user_id: session.user.id,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl,
        isbn: book.isbn ?? null,
        ownership_status: isWishlist ? 'owned' : status,
        in_wishlist: isWishlist,
        rating: 0,
        memo: '',
        shelves: []
    };

    const { data: insertedBook, error } = await supabase.from('library').insert(newBookPayload).select().single();

    // 4. RECONCILE: swap temp ID with the real row, or roll back on failure.
    if (insertedBook) {
        setLibrary(prev => prev.map(b => b.id === tempId ? (insertedBook as Book) : b));
    } else if (error) {
        console.error("Library Insert Error:", error);
        setLibrary(prev => prev.filter(b => b.id !== tempId));
        setLogs(prev => prev.filter(l => !optimisticLogIds.includes(l.id)));
        showToast("Couldn't save that book. Please try again.");
        return;
    }

    // 5. BACKGROUND: Insert Logs to DB
    if (!isWishlist && shouldLog) {
        const newLogs = readersToAdd.map(reader => ({
            user_id: session.user.id,
            book_title: book.title,
            book_author: book.author,
            reader_name: reader,
            timestamp: timestamp,
            notes: note || null
        }));

        const { data: insertedLogs, error: logError } = await supabase.from('reading_logs').insert(newLogs).select();
        if (logError) {
            console.error("Log Insert Error:", logError);
            setLogs(prev => prev.filter(l => !optimisticLogIds.includes(l.id)));
            showToast("Saved the book, but couldn't log the read.");
        } else if (insertedLogs) {
            // Swap the optimistic logs for the real rows so they carry real IDs
            // (needed to delete/edit them later this session).
            setLogs(prev => [
                ...(insertedLogs as ReadingLog[]),
                ...prev.filter(l => !optimisticLogIds.includes(l.id)),
            ]);
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

      const { data, error } = await supabase.from('reading_logs').insert(newLog).select().single();
      if (data) {
          // Swap ID
          setLogs(prev => prev.map(l => l.id === optimisticLog.id ? (data as ReadingLog) : l));
      } else if (error) {
          setLogs(prev => prev.filter(l => l.id !== optimisticLog.id));
          showToast("Couldn't log that read. Please try again.");
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

      const { data, error } = await supabase.from('reading_logs').insert(newLog).select().single();
      if (data) {
          setLogs(prev => prev.map(l => l.id === optimisticLog.id ? (data as ReadingLog) : l));
      } else if (error) {
          setLogs(prev => prev.filter(l => l.id !== optimisticLog.id));
          setSelectedBook(prev => prev ? ({ ...prev, count: Math.max((prev.count || 1) - 1, 0) }) : null);
          showToast("Couldn't log that read. Please try again.");
      }
  };

  const handleRemoveBook = async (id: number | string) => {
      if (!confirm("Delete this reading log entry?")) return;
      // Optimistic Delete
      setLogs(prev => prev.filter(i => i.id !== id));
      setSelectedBook(null);
      // Background DB
      await supabase.from('reading_logs').delete().eq('id', id);
  };

  const handleDeleteAsset = async (id: string | number, title: string) => {
      if (!session) return;
      if (!confirm(`Remove "${title}" from your library?`)) return;
      // Resolve the library row by id (opened from Library) or by title
      // (opened from a log-derived card, where id may be a log id).
      const libBook = library.find(b => b.id === id) || library.find(b => b.title === title);
      const targetId = libBook?.id ?? id;
      // Optimistic Delete
      setLibrary(prev => prev.filter(b => b.id !== targetId));
      setSelectedBook(null);
      // Background DB — by id so duplicate titles are safe
      if (libBook) {
          await supabase.from('library').delete().eq('id', libBook.id).eq('user_id', session.user.id);
      } else {
          await supabase.from('library').delete().eq('title', title).eq('user_id', session.user.id);
      }
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

  const handleUpdateOccasion = async (id: string, occasion: string | null) => {
      setLibrary(prev => prev.map(b => b.id === id ? { ...b, occasion } : b));
      const { error } = await supabase.from('library').update({ occasion }).eq('id', id);
      if (error) showToast("Couldn't update the occasion.");
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
      // Resolve the library row by id (opened from Library) or by title (opened
      // from a log-derived card, where the id is a log id, not a library id).
      const libBook = library.find(b => b.id === id) || (selectedBook ? library.find(b => b.title === selectedBook.title) : undefined);
      if (!libBook) { showToast("Couldn't find that book to update its shelves."); return; }
      // Optimistic
      setLibrary(prev => prev.map(b => b.id === libBook.id ? { ...b, shelves: newShelves } : b));
      setSelectedBook(prev => prev ? { ...prev, shelves: newShelves } : prev);
      // DB
      const { error } = await supabase.from('library').update({ shelves: newShelves }).eq('id', libBook.id);
      if (error) { console.error('Shelf update error:', error); showToast("Couldn't save that shelf. Please try again."); }
  };

  const handleUpdateLogDate = async (id: string | number, iso: string) => {
      // Backdate (or correct) when a book was read.
      setLogs(prev => prev.map(l => l.id === id ? { ...l, timestamp: iso } : l));
      const { error } = await supabase.from('reading_logs').update({ timestamp: iso }).eq('id', id);
      if (error) showToast("Couldn't update the date. Please try again.");
  };

  // --- Chapter books ("Currently Reading") ---
  const handleStartReading = async (book: { title: string; author: string }, startIso: string) => {
      if (!session) return;
      const tempId = `temp-${Date.now()}`;
      const optimistic: ReadingLog = {
          id: tempId, user_id: session.user.id,
          book_title: book.title, book_author: book.author,
          reader_name: activeReader, timestamp: null as any, started_at: startIso,
      };
      setLogs(prev => [optimistic, ...prev]);
      const { data, error } = await supabase.from('reading_logs').insert({
          user_id: session.user.id, book_title: book.title, book_author: book.author,
          reader_name: activeReader, started_at: startIso, timestamp: null,
      }).select().single();
      if (data) {
          setLogs(prev => prev.map(l => l.id === tempId ? (data as ReadingLog) : l));
          showToast(`Started "${book.title}".`);
      } else if (error) {
          console.error('Start reading error:', error);
          setLogs(prev => prev.filter(l => l.id !== tempId));
          showToast(error.message ? `Couldn't start: ${error.message}` : "Couldn't start that book. Please try again.");
      }
  };

  const handleUpdateStartDate = async (logId: string | number, iso: string) => {
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, started_at: iso } : l));
      const { error } = await supabase.from('reading_logs').update({ started_at: iso }).eq('id', logId);
      if (error) showToast("Couldn't update the start date.");
  };

  const handleFinishReading = async (logId: string | number, finishIso: string) => {
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, timestamp: finishIso } : l));
      const { error } = await supabase.from('reading_logs').update({ timestamp: finishIso }).eq('id', logId);
      if (error) {
          setLogs(prev => prev.map(l => l.id === logId ? { ...l, timestamp: null as any } : l));
          showToast("Couldn't finish that book. Please try again.");
      } else {
          showToast('Nice — book finished! 🎉');
      }
  };

  const handleCancelReading = async (logId: string | number) => {
      if (!confirm('Stop tracking this chapter book? This removes the in-progress entry.')) return;
      setLogs(prev => prev.filter(l => l.id !== logId));
      await supabase.from('reading_logs').delete().eq('id', logId);
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

      // Best-effort cover enrichment: the AI only gives us a title/author, so
      // look the book up via the same search route to grab a cover.
      let coverUrl: string | null = null;
      try {
          const res = await fetch('/api/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `${title} ${author}` }),
          });
          const searchData = await res.json();
          coverUrl = searchData?.results?.[0]?.coverUrl ?? null;
          if (coverUrl) setLibrary(prev => prev.map(b => b.id === tempId ? { ...b, cover_url: coverUrl } : b));
      } catch { /* cover is best-effort */ }

      const { data, error } = await supabase.from('library').insert({
          user_id: session.user.id,
          title,
          author,
          cover_url: coverUrl,
          ownership_status: 'owned',
          in_wishlist: isWishlist,
          rating: 0,
          memo: ''
      }).select().single();

      if (data) {
          setLibrary(prev => prev.map(b => b.id === tempId ? (data as Book) : b));
      } else if (error) {
          console.error('Discover Add Error:', error);
          setLibrary(prev => prev.filter(b => b.id !== tempId));
          showToast("Couldn't add that book. Please try again.");
      }
  };

  const handleMagicLogged = (log: ReadingLog) => {
      // The route already inserted the row; just reflect it locally.
      setLogs(prev => [log, ...prev]);
      if (log.reader_name) setActiveReader(log.reader_name);
      showToast(`Logged "${log.book_title}" for ${log.reader_name}.`);
  };

  const handleShareRegistry = () => {
      const url = `${window.location.origin}/registry/${session.user.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const selectedBookHistory = useMemo(() => {
      if (!selectedBook) return [];
      // Only completed reads appear in history; in-progress chapter books show
      // in the "Currently reading" control instead.
      return logs.filter(l => l.book_title === selectedBook.title && l.timestamp).map(l => ({
            id: l.id, title: l.book_title, author: l.book_author, reader: l.reader_name, timestamp: l.timestamp, notes: l.notes, started_at: l.started_at
        } as any)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedBook, logs]);

  // The active reader's in-progress chapter book for the open title (if any).
  const selectedBookActiveReading = useMemo(() => {
      if (!selectedBook) return null;
      return logs.find(l => l.book_title === selectedBook.title && l.reader_name === activeReader && l.started_at && !l.timestamp) || null;
  }, [selectedBook, logs, activeReader]);

  // --- RENDER FUNCTIONS ---
  
  const renderHomeView = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <section className="flex flex-col items-center justify-center py-12">
          {/* CHANGED: Label and Value for Lifetime Reads */}
          <h2 className="text-[10px] font-extrabold tracking-[0.2em] text-slate-400 uppercase mb-2">{activeReader}'s Lifetime Reads</h2>
          <div className="font-mono-tabular text-9xl font-extrabold text-slate-900 tracking-tighter transition-all">{stats.lifetimeCount}</div>
      </section>
      <section className="space-y-8">
        <StreakCard current={streak.current} longest={streak.longest} readerName={activeReader} />
        {(() => {
          const earned = MILESTONES.filter(m => m.test({ lifetime: stats.lifetimeCount, streak: streak.current }));
          if (earned.length === 0) return null;
          return (
            <div>
              <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Achievements</h3>
              <div className="flex flex-wrap gap-2">
                {earned.map(m => (
                  <div key={m.id} className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-full pl-2 pr-3 py-1.5 shadow-sm">
                    <span className="text-base leading-none">{m.emoji}</span>
                    <span className="text-xs font-bold text-slate-700">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        {stats.currentlyReading.length > 0 && (
          <div>
            <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Currently Reading</h3>
            <div className="space-y-3">
              {stats.currentlyReading.map((l) => {
                const lib = library.find(b => b.title === l.book_title);
                const cover = getBookCover(l.book_title);
                const day = daysBetween(l.started_at, new Date().toISOString());
                return (
                  <div key={l.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
                    <button
                      onClick={() => lib && setSelectedBook({ ...lib, cover: lib.cover_url || undefined, ownershipStatus: lib.ownership_status, inWishlist: lib.in_wishlist, rating: lib.rating, memo: lib.memo || undefined, shelves: lib.shelves })}
                      className="flex items-center gap-4 flex-1 text-left min-w-0"
                    >
                      <div className="w-12 h-16 rounded-xl bg-amber-100 overflow-hidden flex items-center justify-center text-amber-500 shrink-0 border border-amber-200">
                        {cover ? <img src={cover} className="w-full h-full object-cover" /> : <BookMarked size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 line-clamp-1">{l.book_title}</p>
                        <p className="text-xs text-amber-600 font-bold">Day {day} · since {l.started_at ? new Date(l.started_at).toLocaleDateString() : ''}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleFinishReading(l.id, new Date().toISOString())}
                      className="px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold active:scale-95 transition-transform shrink-0"
                    >
                      Finish
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-4">Heavy Rotation</h3>
          <div className="grid grid-cols-3 gap-3">
             {Object.values(stats.completed.reduce((acc: any, item) => {
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
             {stats.completed.length === 0 && (<div className="col-span-3 py-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-xs font-bold">No reading history yet.</div>)}
          </div>
        </div>
      </section>
    </div>
  );

  const renderLibraryView = () => {
    const filters = [
        { id: 'owned', label: 'Library' },
        { id: 'wishlist', label: 'Wish List' },
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
            </div>

            <input type="text" placeholder="Search..." className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-4 py-4 mb-4" value={search} onChange={(e) => setSearch(e.target.value)} />
            
            <div className="space-y-8">
                {sortedKeys.map(letter => (
                    <div key={letter}>
                        <h2 className="text-sm font-extrabold text-slate-400 mb-4 px-2 sticky top-20">{letter}</h2>
                        <div className="space-y-3">
                            {groupedBooks[letter].map((book: Book) => (
                              <div key={book.id || `temp-${book.title}`}>
                                <button
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

                                {/* Wishlist meta: gift status + occasion picker */}
                                {filter === 'wishlist' && book.in_wishlist && (
                                    <div className="flex items-center gap-2 px-3 pt-2 flex-wrap">
                                        {book.purchased_at ? (
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                🎁 Purchased{book.purchased_by ? ` by ${book.purchased_by}` : ''}
                                            </span>
                                        ) : (
                                            OCCASIONS.map(o => (
                                                <button
                                                    key={o}
                                                    onClick={() => handleUpdateOccasion(book.id, book.occasion === o ? null : o)}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                        book.occasion === o
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-slate-400 border-slate-200'
                                                    }`}
                                                >
                                                    {o}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                              </div>
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
            <div className="mb-6"><StreakCard current={streak.current} longest={streak.longest} readerName={activeReader} /></div>
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
        {/* Scanner */}
        <button
            onClick={() => setScannerOpen(true)}
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
        {readers.length > 0 && activeReader === readers[readers.length-1] ? (
          <ParentDashboard
            readers={readers}
            readerAvatars={readerAvatars}
            readerGoals={readerGoals}
            onOpenAvatar={handleOpenAvatarModal}
            onDeleteChild={handleDeleteChild}
            onUpdateChildGoal={handleUpdateChildGoal}
            onAddChild={handleAddChildClick}
            onShowYearReview={() => setShowYearReview(true)}
            onChangePin={handleChangePin}
            onResetApp={handleResetApp}
            onLogout={handleLogout}
            onExitParentMode={() => setActiveReader(readers[0] || 'Leo')}
          />
        ) : (activeTab === 'library' ? renderLibraryView() : activeTab === 'home' ? renderHomeView() : renderHistoryView())}
      </main>
      {readers.length > 0 && activeReader !== readers[readers.length-1] && (<BottomNav activeTab={activeTab} onTabChange={setActiveTab} />)}
      {readers.length > 0 && activeReader !== readers[readers.length-1] && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center items-center gap-4 z-40 pointer-events-none">
            {/* Standard Add Button */}
            <button 
                onClick={() => { setScanQuery(''); setAddModalOpen(true); }}
                className="pointer-events-auto bg-slate-900 text-slate-50 px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2 active:scale-95 transition-transform hover:bg-slate-800"
            >
                <Plus size={20} strokeWidth={3} />
                <span>Add</span>
            </button>
            
            {/* Quick Log (natural language) Button */}
            <button
                onClick={() => setMagicLogOpen(true)}
                className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform hover:shadow-emerald-500/25"
                aria-label="Quick log"
            >
                <Wand2 size={22} />
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
        initialQuery={scanQuery}
    />
    <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(isbn) => {
            setScannerOpen(false);
            setScanQuery(isbn);     // search route auto-detects ISBN
            setAddModalOpen(true);  // hand off to the existing add flow
        }}
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
        onUpdateLogDate={handleUpdateLogDate}
        allShelves={uniqueShelves}
        activeReader={activeReader}
        activeReading={selectedBookActiveReading}
        onStartReading={handleStartReading}
        onUpdateStartDate={handleUpdateStartDate}
        onFinishReading={handleFinishReading}
        onCancelReading={handleCancelReading}
    />
    <GoalAdjustmentModal isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} type={editingGoalType} currentGoal={readerGoals[activeReader]?.[editingGoalType] || 3} onSave={handleGoalSave} />
    <PinModal
        isOpen={isPinModalOpen}
        mode={pinIntent === 'change' || !pinRecord ? 'set' : 'verify'}
        pinRecord={pinRecord}
        onClose={() => setPinModalOpen(false)}
        onVerified={onPinVerified}
        onSet={onPinSet}
        onForgot={handleForgotPin}
    />
    <AddChildModal isOpen={isChildModalOpen} onClose={() => setChildModalOpen(false)} onAdd={handleSaveChild} existingNames={readers} />
    <AvatarModal isOpen={isAvatarModalOpen} onClose={() => setAvatarModalOpen(false)} onSave={handleSaveAvatar} currentAvatar={editingAvatarFor ? readerAvatars[editingAvatarFor] : null} name={editingAvatarFor || ''} />
    <DiscoverModal 
        isOpen={isDiscoverOpen} 
        onClose={() => setDiscoverOpen(false)} 
        onAddBook={handleDiscoverAdd}
        userId={session?.user?.id}
    />
    <MagicLogModal
        isOpen={isMagicLogOpen}
        onClose={() => setMagicLogOpen(false)}
        readers={readers.slice(0, -1)}
        onLogged={handleMagicLogged}
    />
    {showYearReview && (
        <YearInReview
            logs={logs}
            library={library}
            readerName={activeReader}
            onClose={() => setShowYearReview(false)}
        />
    )}
    {milestoneToast && <MilestoneToast milestone={milestoneToast} onDone={() => setMilestoneToast(null)} />}
    {toast && (
      <div className="fixed inset-x-0 bottom-28 z-[125] flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900 text-white text-sm font-bold rounded-2xl px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
          {toast}
        </div>
      </div>
    )}
    </>
  );
};
