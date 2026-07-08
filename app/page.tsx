'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ScanBarcode, Plus, Check, Loader2, Sparkles, Wand2 } from 'lucide-react';
import AddBookModal, { GoogleBook } from '@/components/AddBookModal';
import BookDetailModal from '@/components/BookDetailModal';
import GoalAdjustmentModal from '@/components/GoalAdjustmentModal';
import PinModal from '@/components/PinModal';
import AddChildModal from '@/components/AddChildModal';
import AvatarModal from '@/components/AvatarModal';
import OnboardingWizard from '@/components/OnboardingWizard'; 
import DiscoverModal from '@/components/DiscoverModal';
import BarcodeScanner from '@/components/BarcodeScanner';
import MilestoneToast, { Milestone } from '@/components/MilestoneToast';
import MagicLogModal from '@/components/MagicLogModal';
import YearInReview from '@/components/YearInReview';
import { supabase } from '@/lib/supabaseClient';
import { getStoredPin, storePin, clearStoredPin, PinRecord } from '@/lib/pin';
import { uploadMemoryPhoto } from '@/lib/uploadMemoryPhoto';

// A log id is "pending" (optimistic, not yet persisted) until the DB row swaps
// in. Temp ids are prefixed with "temp"; guard edits that need a real row id.
const isPendingLogId = (id: string | number) => typeof id === 'string' && id.startsWith('temp');

import { MILESTONES } from '@/lib/constants';
import type { Tab, Book, ReadingLog, DisplayItem } from '@/lib/types';
import { getAvatarUrl } from '@/lib/helpers';
import { useStats } from '@/hooks/useStats';

import LandingPage from '@/components/LandingPage';
import BottomNav from '@/components/BottomNav';
import ParentDashboard from '@/components/views/ParentDashboard';
import HistoryView from '@/components/views/HistoryView';
import HomeView from '@/components/views/HomeView';
import LibraryView from '@/components/views/LibraryView';

// --- MAIN APP ---
export default function Home() {
  // Global State
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [libraryFocus, setLibraryFocus] = useState<{ id: string; nonce: number } | null>(null);
  const [showReaderMenu, setShowReaderMenu] = useState(false);
  
  const [activeReader, setActiveReader] = useState(''); 
  const [readers, setReaders] = useState(['Leo', 'Maya', 'Parents']);
  const [readerGoals, setReaderGoals] = useState<Record<string, { daily: number, weekly: number }>>({});
  const [readerAvatars, setReaderAvatars] = useState<Record<string, string>>({});

  const [library, setLibrary] = useState<Book[]>([]); 
  const [logs, setLogs] = useState<ReadingLog[]>([]);       

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

  const { stats, streak, chartData, uniqueShelves, groupedHistory } = useStats({ logs, library, activeReader, readerGoals, getBookCover });

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
    // First-ever solo read for this reader, computed straight from the logs.
    const hasSolo = logs.some(l => l.reader_name === activeReader && l.read_mode === 'by_child' && l.timestamp);
    if (hasSolo) unlocked.push('first-solo');
    const newly = unlocked.filter(id => !stored.includes(id));
    if (newly.length === 0) return;

    try { localStorage.setItem(key, JSON.stringify(unlocked)); } catch { /* ignore */ }

    if (celebratedInit.current.has(activeReader)) {
      if (newly.includes('first-solo')) {
        setMilestoneToast({ id: 'first-solo', label: 'First Solo Read! 🌟', emoji: '🌟' });
      } else {
        const top = MILESTONES.filter(m => newly.includes(m.id)).pop();
        if (top) setMilestoneToast({ id: top.id, label: top.label, emoji: top.emoji });
      }
    } else {
      celebratedInit.current.add(activeReader);
    }
  }, [stats.lifetimeCount, streak.current, activeReader, session, logs]);

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
  const handleAddBook = async (book: GoogleBook, selectedReaders: string[], status: 'owned' | 'borrowed' | 'wishlist', shouldLog: boolean, note: string, readDateIso?: string, quote: string = '', photoFile: File | null = null, readMode: string = 'to_child') => {
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
                quote: quote || undefined,
                read_mode: readMode,
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
        // Upload the memory photo first (if any) so its URL goes in with the logs.
        let photoUrl: string | null = null;
        if (photoFile) {
            try { photoUrl = await uploadMemoryPhoto(photoFile, session.user.id); }
            catch { showToast("Saved, but the photo didn't upload."); }
        }
        const newLogs = readersToAdd.map(reader => ({
            user_id: session.user.id,
            book_title: book.title,
            book_author: book.author,
            reader_name: reader,
            timestamp: timestamp,
            notes: note || null,
            quote: quote || null,
            photo_url: photoUrl,
            read_mode: readMode,
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
          timestamp: timestamp,
          read_mode: 'to_child'
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

  const handleReadAgain = async (book: any, readMode: string = 'to_child') => {
      if (!session) return;
      const title = book.title || book.book_title;
      const author = book.author || book.book_author;
      const timestamp = new Date().toISOString();

      const newLog = {
          user_id: session.user.id,
          book_title: title,
          book_author: author,
          reader_name: activeReader,
          timestamp: timestamp,
          read_mode: readMode
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
      // A due date only makes sense for a borrowed book; drop it when the book
      // becomes owned.
      const clearsDue = newStatus === 'owned';
      // Optimistic
      setLibrary(prev => prev.map(b => b.id === id ? { ...b, ownership_status: newStatus, ...(clearsDue ? { due_date: null } : {}) } : b));
      setSelectedBook((prev) => prev ? ({ ...prev, ownershipStatus: newStatus, ...(clearsDue ? { due_date: null } : {}) }) : null);
      // DB
      await supabase.from('library').update({ ownership_status: newStatus, ...(clearsDue ? { due_date: null } : {}) }).eq('id', id);
  };

  const handleUpdateDueDate = async (id: string, due: string | null) => {
      const prev = library.find(b => b.id === id)?.due_date ?? null;
      // Optimistic
      setLibrary(cur => cur.map(b => b.id === id ? { ...b, due_date: due } : b));
      setSelectedBook(cur => cur ? { ...cur, due_date: due } : null);
      // DB
      const { error } = await supabase.from('library').update({ due_date: due }).eq('id', id);
      if (error) {
          setLibrary(cur => cur.map(b => b.id === id ? { ...b, due_date: prev } : b));
          setSelectedBook(cur => cur ? { ...cur, due_date: prev } : null);
          showToast("Couldn't update the due date.");
      }
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

  // Attach a photo and/or quote to an existing read (Reading Memories).
  const handleAddMemory = async (logId: string | number, memory: { quote?: string; file?: File | null }) => {
      if (!session) return;
      if (isPendingLogId(logId)) { showToast('Give that read a moment to save, then add the memory.'); return; }
      const prevLog = logs.find(l => l.id === logId);
      let photoUrl: string | null = prevLog?.photo_url ?? null;
      if (memory.file) {
          try { photoUrl = await uploadMemoryPhoto(memory.file, session.user.id); }
          catch { showToast("The photo didn't upload. Please try again."); return; }
      }
      const quote = memory.quote?.trim() || prevLog?.quote || null;
      // Optimistic
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, photo_url: photoUrl, quote } : l));
      const { error } = await supabase.from('reading_logs').update({ photo_url: photoUrl, quote }).eq('id', logId);
      if (error) {
          // Roll back to the prior values.
          setLogs(prev => prev.map(l => l.id === logId ? { ...l, photo_url: prevLog?.photo_url ?? null, quote: prevLog?.quote ?? null } : l));
          showToast("Couldn't save that memory. Please try again.");
      }
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

  const handleFinishReading = async (logId: string | number, finishIso: string, readMode: string = 'to_child') => {
      const prevMode = logs.find(l => l.id === logId)?.read_mode ?? 'to_child';
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, timestamp: finishIso, read_mode: readMode } : l));
      const { error } = await supabase.from('reading_logs').update({ timestamp: finishIso, read_mode: readMode }).eq('id', logId);
      if (error) {
          setLogs(prev => prev.map(l => l.id === logId ? { ...l, timestamp: null as any, read_mode: prevMode } : l));
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

  const selectedBookHistory = useMemo(() => {
      if (!selectedBook) return [];
      // Only completed reads appear in history; in-progress chapter books show
      // in the "Currently reading" control instead.
      return logs.filter(l => l.book_title === selectedBook.title && l.timestamp).map(l => ({
            id: l.id, title: l.book_title, author: l.book_author, reader: l.reader_name, timestamp: l.timestamp, notes: l.notes, started_at: l.started_at, photo_url: l.photo_url, quote: l.quote
        } as any)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedBook, logs]);

  // The active reader's in-progress chapter book for the open title (if any).
  const selectedBookActiveReading = useMemo(() => {
      if (!selectedBook) return null;
      return logs.find(l => l.book_title === selectedBook.title && l.reader_name === activeReader && l.started_at && !l.timestamp) || null;
  }, [selectedBook, logs, activeReader]);

  // --- RENDER FUNCTIONS ---
  
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
        ) : (activeTab === 'library' ? (
          <LibraryView
            library={library}
            uniqueShelves={uniqueShelves}
            userId={session.user.id}
            onSelectBook={setSelectedBook}
            onUpdateOccasion={handleUpdateOccasion}
            focusFilter={libraryFocus}
          />
        ) : activeTab === 'home' ? (
          <HomeView
            activeReader={activeReader}
            stats={stats}
            streak={streak}
            library={library}
            getBookCover={getBookCover}
            onSelectBook={setSelectedBook}
            onFinishReading={handleFinishReading}
            onViewBorrowed={() => { setLibraryFocus({ id: 'borrowed', nonce: Date.now() }); setActiveTab('library'); }}
          />
        ) : (
          <HistoryView
            stats={stats}
            chartData={chartData}
            streak={streak}
            activeReader={activeReader}
            groupedHistory={groupedHistory}
            onSelectBook={setSelectedBook}
            onQuickAdd={handleQuickAdd}
            onOpenGoal={(type) => { setEditingGoalType(type); setGoalModalOpen(true); }}
          />
        ))}
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
        onUpdateDueDate={handleUpdateDueDate}
        onUpdateWishlist={handleUpdateWishlist}
        onUpdateRating={handleUpdateRating} 
        onUpdateMemo={handleUpdateMemo}
        onUpdateShelves={handleUpdateShelves}
        onUpdateLogDate={handleUpdateLogDate}
        onAddMemory={handleAddMemory}
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
