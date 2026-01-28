'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null;

  const getRoleLabel = (role: string) => {
    return {
      ADMIN: 'Administrateur',
      PROF: 'Professeur',
      STUDENT: 'Étudiant',
    }[role] || role;
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <header className="bg-white shadow">
      <nav className="container flex justify-between items-center py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ClasseTrack
          </Link>
          <div className="text-sm text-gray-600">
            {(session.user as any)?.name} ({getRoleLabel((session.user as any)?.role)})
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
