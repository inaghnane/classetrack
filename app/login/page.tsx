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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userId, setUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
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

      // Vérifier si l'utilisateur doit changer son mot de passe
      if (user.mustChangePassword) {
        setUserId(user.id);
        setShowChangePassword(true);
        setIsLoading(false);
        return;
      }

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
      }[(user.role as string) || 'STUDENT'] || '/';

      router.push(redirectPath);
    } catch (err: any) {
      setError('Erreur lors de la connexion: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || 'Erreur lors du changement de mot de passe');
        return;
      }

      // Reconnexion automatique
      alert('✅ Mot de passe changé avec succès! Reconnexion...');
      const result = await signIn('credentials', {
        email,
        password: newPassword,
        redirect: false,
      });

      if (result?.ok) {
        const userRes = await fetch('/api/me');
        const user = await userRes.json();
        
        const redirectPath = {
          ADMIN: '/admin',
          PROF: '/prof',
          STUDENT: '/student',
        }[(user.role as string) || 'STUDENT'] || '/';

        router.push(redirectPath);
      }
    } catch (err: any) {
      setPasswordError('Erreur: ' + err.message);
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

      {/* Modal changement de mot de passe obligatoire */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-600">
              🔒 Changement de mot de passe requis
            </h2>
            <p className="text-gray-700 mb-6">
              Pour des raisons de sécurité, vous devez changer votre mot de passe avant de continuer.
            </p>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Nouveau mot de passe (min. 8 caractères)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field w-full"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field w-full"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                ✅ Changer le mot de passe
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Cette fenêtre ne peut pas être fermée. Vous devez changer votre mot de passe pour continuer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
