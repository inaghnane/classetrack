'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Justification {
  id: string;
  reason: string;
  fileUrl: string | null;
  adminComment: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  seance: {
    date: string;
    startTime: string;
    endTime: string;
    module: {
      name: string;
      code: string;
    };
    groupe: {
      name: string;
    };
  };
}

export default function JustificatifsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [selectedJustif, setSelectedJustif] = useState<Justification | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchJustifications();
    }
  }, [status]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'PROF') {
    router.push('/login');
    return null;
  }

  const fetchJustifications = async () => {
    try {
      const res = await fetch('/api/prof/justification');
      const data = await res.json();
      setJustifications(data);
    } catch (error) {
      console.error('Error fetching justifications:', error);
    }
  };

  const handleUpdateStatus = async (justificationId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/prof/justification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          justificationId,
          status: newStatus,
          adminComment: adminComment.trim() || null,
        }),
      });

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `✅ Justificatif ${newStatus === 'APPROVED' ? 'approuvé' : 'rejeté'} avec succès`,
        });
        setSelectedJustif(null);
        setAdminComment('');
        fetchJustifications();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Erreur' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    }
  };

  const filteredJustifications = justifications.filter((j) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return j.status === 'PENDING';
    if (filter === 'approved') return j.status === 'APPROVED';
    if (filter === 'rejected') return j.status === 'REJECTED';
    return true;
  });

  const pendingCount = justifications.filter((j) => j.status === 'PENDING').length;

  return (
    <>
      <Header />
      <main className="container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Justificatifs d'Absence</h1>
          <button
            onClick={() => router.push('/prof')}
            className="btn-secondary"
          >
            ← Retour aux séances
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded border-l-4 ${
              message.type === 'success'
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'bg-red-100 border-red-500 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded font-semibold ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⏳ En attente ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded font-semibold ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tous ({justifications.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded font-semibold ${
              filter === 'approved'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ✅ Approuvés
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded font-semibold ${
              filter === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ❌ Rejetés
          </button>
        </div>

        {/* Liste des justificatifs */}
        <div className="space-y-4">
          {filteredJustifications.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Aucun justificatif {filter !== 'all' && `en ${filter === 'pending' ? 'attente' : filter === 'approved' ? 'approuvé' : 'rejeté'}`}
            </p>
          ) : (
            filteredJustifications.map((justif) => (
              <div key={justif.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">
                      {justif.student.firstName} {justif.student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{justif.student.email}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      justif.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : justif.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {justif.status === 'APPROVED'
                      ? '✅ Approuvé'
                      : justif.status === 'REJECTED'
                      ? '❌ Rejeté'
                      : '⏳ En attente'}
                  </span>
                </div>

                <div className="mb-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Séance concernée:</p>
                  <p className="text-sm">
                    <strong>{justif.seance.module.name}</strong> ({justif.seance.module.code})
                  </p>
                  <p className="text-sm text-gray-600">
                    {justif.seance.groupe.name} - {new Date(justif.seance.date).toLocaleDateString('fr-FR')} à {justif.seance.startTime}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Soumis le {new Date(justif.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-semibold mb-1">💬 Commentaire de l'étudiant:</p>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    {justif.reason}
                  </p>
                </div>

                {justif.fileUrl && (
                  <div className="mb-3">
                    <a
                      href={justif.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-semibold"
                    >
                      📎 Voir la pièce justificative
                    </a>
                  </div>
                )}

                {justif.adminComment && (
                  <div className="mb-3 p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                    <p className="text-xs font-semibold text-purple-900 mb-1">
                      👨‍🏫 Votre retour:
                    </p>
                    <p className="text-sm text-purple-800">{justif.adminComment}</p>
                  </div>
                )}

                {justif.status === 'PENDING' && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      onClick={() => {
                        setSelectedJustif(justif);
                        setAdminComment(justif.adminComment || '');
                      }}
                      className="btn-primary w-full"
                    >
                      📝 Traiter ce justificatif
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de traitement */}
      {selectedJustif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Traiter le justificatif</h3>
              <button
                onClick={() => {
                  setSelectedJustif(null);
                  setAdminComment('');
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="font-bold mb-2">
                Étudiant: {selectedJustif.student.firstName} {selectedJustif.student.lastName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Séance: {selectedJustif.seance.module.name} - {new Date(selectedJustif.seance.date).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-sm mb-2">
                <strong>Raison:</strong> {selectedJustif.reason}
              </p>
              {selectedJustif.fileUrl && (
                <a
                  href={selectedJustif.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  📎 Voir la pièce jointe
                </a>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">
                Votre commentaire / retour à l'étudiant (optionnel)
              </label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Ajoutez un commentaire pour expliquer votre décision..."
                rows={4}
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                💡 Ce commentaire sera visible par l'étudiant
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleUpdateStatus(selectedJustif.id, 'APPROVED')}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded font-bold hover:bg-green-700 transition"
              >
                ✅ Approuver
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedJustif.id, 'REJECTED')}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded font-bold hover:bg-red-700 transition"
              >
                ❌ Rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
