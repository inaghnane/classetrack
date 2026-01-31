'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getOrCreateDeviceId } from '@/lib/device';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // S'assurer que localStorage est accessible côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError('Email ou mot de passe incorrect');
        setIsLoading(false);
        return;
      }

      // Récupérer les informations de l'utilisateur
      const res = await fetch('/api/me');
      const user = await res.json();

      // Pour les ÉTUDIANTS: vérifier la restriction d'appareil
      if (user.role === 'STUDENT' && isClient) {
        try {
          const deviceId = getOrCreateDeviceId();
          
          const deviceRes = await fetch('/api/student/validate-device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: user.id,
              deviceId,
            }),
          });

          if (!deviceRes.ok) {
            const deviceError = await deviceRes.json();
            setError(`🔒 Accès refusé: ${deviceError.error}`);
            setIsLoading(false);
            return;
          }
        } catch (deviceErr) {
          console.error('Device validation error:', deviceErr);
          // Continue même si erreur device (fallback)
        }
      }

      // Redirect based on role
      const redirectPath = {
        ADMIN: '/admin',
        PROF: '/prof',
        STUDENT: '/student',
      }[user.role] || '/';

      router.push(redirectPath);
    } catch (err: any) {
      setError('Erreur lors de la connexion: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          ClasseTrack
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Gestion des absences avec QR code dynamique
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Comptes de test :
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>Admin: admin@gmail.com / Admin@12345</li>
            <li>Prof: prof@classetrack.com / Prof@12345</li>
            <li>Student: student@classetrack.com / Student@12345</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
