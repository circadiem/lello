
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Library as LibraryIcon, BookOpen, Clock } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/library', icon: LibraryIcon, label: 'Library' },
    { href: '/', icon: BookOpen, label: 'Home' },
    { href: '/activity', icon: Clock, label: 'Activity' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-100/90 backdrop-blur-xl border-t border-slate-200 px-12 py-6 flex items-center justify-between z-50 rounded-t-[2.5rem] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {navItems.map(({ href, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link 
            key={href} 
            href={href}
            className={`transition-all duration-300 active:scale-90 ${
              isActive ? 'text-slate-900 scale-110' : 'text-slate-300 hover:text-slate-400'
            }`}
          >
            <Icon size={32} strokeWidth={isActive ? 2.5 : 2} />
          </Link>
        );
      })}
    </nav>
  );
}
