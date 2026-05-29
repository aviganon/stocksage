'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'סקירה' },
  { href: '/admin/users', label: 'משתמשים' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-white">
              Stock<span className="text-indigo-400">Sage</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">Admin</span>
            </Link>
            <nav className="flex gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === n.href
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            → חזרה לאפליקציה
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
