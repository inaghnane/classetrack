'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface MenuItem {
  label: string;
  href: string;
  icon?: string;
}

interface SidebarProps {
  role: 'ADMIN' | 'PROF' | 'STUDENT';
}

const menuItems: Record<string, MenuItem[]> = {
  ADMIN: [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Utilisateurs', href: '/admin/user' },
    { label: 'Import', href: '/admin/import' },
    { label: 'filière', href: '/admin/filiere' },
    { label: 'module', href: '/admin/module' },
    { label: 'groupe', href: '/admin/groupe' },
    { label: 'Séances', href: '/admin/seance' }
  ],
  PROF: [
    { label: 'Mes filière', href: '/prof' },
    { label: 'Justificatifs', href: '/prof/justifications' }
  ],
  STUDENT: [
    { label: 'Mes module', href: '/student' },
    { label: 'Justificatifs', href: '/student/justifications' },
    { label: 'Statistiques', href: '/student/stats' }
  ]
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role] || [];

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">ClasseTrack</h2>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded transition ${
              pathname === item.href
                ? 'bg-blue-600'
                : 'hover:bg-gray-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="w-full mt-8 px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
      >
        Déconnexion
      </button>
    </aside>
  );
}
