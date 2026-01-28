'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

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

    // Redirect based on role
    const res = await fetch('/api/me');
    const user = await res.json();

    const redirectPath = {
      ADMIN: '/admin',
      PROF: '/prof',
      STUDENT: '/student',
    }[user.role] || '/';

    router.push(redirectPath);
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
            <li>Admin: admin@example.com / admin123</li>
            <li>Prof: prof@example.com / prof123</li>
            <li>Student: student1@example.com / student123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
