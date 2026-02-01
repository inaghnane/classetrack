'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();

  if (!session) return null;

  const getRoleLabel = (role: string) => {
    return {
      ADMIN: 'Administrateur',
      PROF: 'Professeur',
      STUDENT: 'Étudiant',
    }[role] || role;
  };

  const handleLogout = async () => {
    try {
      // Use signOut with callbackUrl instead of manual redirect
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <header className="bg-white shadow">
      <nav className="container flex justify-between items-center py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ClasseTrack
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {(session.user as any)?.name} ({getRoleLabel((session.user as any)?.role)})
            </div>
            {(session.user as any)?.role === 'PROF' && (
              <Link 
                href="/prof/justificatifs"
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                📄 Justificatifs
              </Link>
            )}
            {(session.user as any)?.role === 'ADMIN' && (
              <Link 
                href="/admin/seances"
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                📊 Séances
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-secondary"
        >
          Déconnexion
        </button>
      </nav>
    </header>
  );
}
