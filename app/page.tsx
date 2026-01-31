'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    try {
      if (status === 'unauthenticated') {
        router.push('/login');
      } else if (status === 'authenticated' && session) {
        const role = (session.user as any)?.role as keyof typeof pathMap;
        const pathMap = {
          ADMIN: '/admin',
          PROF: '/prof',
          STUDENT: '/student',
        };
        const path = pathMap[role];

        if (path) {
          router.push(path);
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/login');
    }
  }, [status, session, router, isClient]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  return null;
}
