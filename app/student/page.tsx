'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineSyncBanner from '@/components/OfflineSyncBanner';

export default function StudentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seances, setSeances] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('seances');
  const [showScanner, setShowScanner] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [selectedSeance, setSelectedSeance] = useState<string>('');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const QrScanner = dynamic(() => import('@yudiel/react-qr-scanner').then((m) => m.QrScanner), {
    ssr: false,
  });
  const [showCamera, setShowCamera] = useState(false);

  const fetchSeances = async () => {
    const res = await fetch('/api/student/seances');
    const data = await res.json();
    setSeances(data);
  };

  const fetchAttendance = async () => {
    const res = await fetch('/api/student/attendance');
    const data = await res.json();
    setAttendance(data);
  };

  const handleScan = async () => {
    if (!selectedSeance || !tokenInput) {
      setMessage({ type: 'error', text: 'Saisir le token QR et sélectionner une séance' });
      return;
    }

    try {
      const res = await fetch('/api/student/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seanceId: selectedSeance,
          token: tokenInput,
          scannedAt: new Date(),
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Présence marquée!' });
        setTokenInput('');
        setSelectedSeance('');
        setShowScanner(false);
        fetchSeances();
        fetchAttendance();
      } else {
        const error = await res.json();
        setMessage({
          type: 'error',
          text: error.error || 'Erreur lors du scan',
        });
      }
    } catch (error) {
      // Offline mode - store in localStorage
      const queue = JSON.parse(localStorage.getItem('scanQueue') || '[]');
      queue.push({
        id: Math.random().toString(),
        seanceId: selectedSeance,
        token: tokenInput,
        timestamp: Date.now(),
      });
      localStorage.setItem('scanQueue', JSON.stringify(queue));
      setMessage({
        type: 'warning',
        text: 'Mode offline - Scan sauvegardé localement',
      });
      setTokenInput('');
      setShowScanner(false);
    }
  };

  useEffect(() => {
    fetchSeances();
    fetchAttendance();
  }, []);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'STUDENT') {
    router.push('/login');
    return null;
  }

  const openSeances = seances.filter((s) => s.status === 'OPEN');
  const markedSeances = attendance.map((a) => a.seanceId);

  return (
    <>
      <Header />
      <OfflineSyncBanner />

      <main className="container">
        <h1 className="text-3xl font-bold mb-6">Mes Séances</h1>

        {message && (
          <div
            className={`mb-4 p-4 rounded border-l-4 ${
              message.type === 'success'
                ? 'bg-green-100 border-green-500 text-green-700'
                : message.type === 'warning'
                ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                : 'bg-red-100 border-red-500 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('seances')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'seances'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Mes Séances
          </button>
          <button
            onClick={() => setActiveTab('historique')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'historique'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Historique
          </button>
        </div>

        {activeTab === 'seances' && (
          <div>
            <div className="mb-6">
              {openSeances.length > 0 && (
                <div className="card mb-4 bg-blue-50">
                  <h3 className="font-bold text-blue-900 mb-2">
                    Séances ouvertes ({openSeances.length})
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setShowScanner(!showScanner)}
                      className="btn-primary"
                    >
                      {showScanner ? '✕ Fermer' : '📱 Scanner présence'}
                    </button>
                  </div>

                  {showScanner && (
                    <div className="mt-4 p-4 bg-white rounded space-y-4">
                      <div className="mb-4">
                        <label className="block font-semibold mb-2">
                          Sélectionner séance
                        </label>
                        <select
                          value={selectedSeance}
                          onChange={(e) => setSelectedSeance(e.target.value)}
                          className="input-field"
                        >
                          <option value="">-- Choisir --</option>
                          {openSeances.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.module.name} ({s.groupe.name}) - Prof. {s.professor.firstName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Méthode 1: Scan caméra (PRINCIPALE) */}
                      <div className="p-3 bg-green-50 rounded border-2 border-green-400">
                        <label className="block font-bold mb-2 text-green-900">
                          📷 Méthode 1: Scanner le QR avec caméra (recommandé)
                        </label>
                        {showCamera ? (
                          <>
                            <div className="rounded overflow-hidden border-2 border-gray-200 mb-2">
                              <QrScanner
                                onDecode={(result) => {
                                  const value = Array.isArray(result) ? result[0] : result;
                                  if (value) {
                                    setTokenInput(value);
                                    setMessage({ type: 'success', text: 'QR scanné! Cliquez sur Marquer présence.' });
                                  }
                                }}
                                onError={(err) => {
                                  console.error(err);
                                  setMessage({ type: 'warning', text: 'Caméra indisponible. Utilisez la copie/colle.' });
                                }}
                                constraints={{ facingMode: 'environment' }}
                                scanDelay={800}
                                style={{ width: '100%' }}
                              />
                            </div>
                            <button
                              onClick={() => setShowCamera(false)}
                              className="w-full btn-secondary"
                            >
                              ✕ Fermer caméra
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setShowCamera(true)}
                            className="w-full btn-primary"
                          >
                            Appuyer pour activer caméra
                          </button>
                        )}
                      </div>

                      {/* Méthode 2: Saisie manuelle (fallback) */}
                      <div className="p-3 bg-gray-50 rounded border border-gray-300">
                        <label className="block font-semibold mb-2 text-gray-700">
                          Ou saisir le token manuellement
                        </label>
                        <input
                          type="text"
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          placeholder="Copier/coller le token affiché par le professeur"
                          className="input-field font-mono text-sm"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          💡 Si la caméra ne marche pas, demandez au prof de geler le QR
                        </p>
                      </div>

                      <button
                        onClick={handleScan}
                        className="w-full btn-primary font-bold py-3"
                      >
                        ✓ Marquer présence
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seances.map((seance) => {
                const isMarked = markedSeances.includes(seance.id);
                return (
                  <div
                    key={seance.id}
                    className={`card ${
                      isMarked ? 'bg-green-50 border-2 border-green-300' : ''
                    }`}
                  >
                    <h3 className="font-bold text-lg mb-2">{seance.module.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Groupe: {seance.groupe.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Prof: {seance.professor.firstName} {seance.professor.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Salle: {seance.room}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {new Date(seance.startsAt).toLocaleString('fr-FR')}
                    </p>

                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          seance.status === 'OPEN'
                            ? 'bg-green-100 text-green-800'
                            : seance.status === 'CLOSED'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {seance.status}
                      </span>
                      {isMarked && (
                        <span className="text-green-700 font-bold">✓ Présent</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'historique' && (
          <div>
            <h2 className="font-bold text-xl mb-4">Historique de Présence</h2>
            <div className="space-y-2">
              {attendance.length === 0 ? (
                <p className="text-gray-600">Aucune présence enregistrée</p>
              ) : (
                attendance.map((att) => (
                  <div key={att.id} className="card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{att.seance.module.name}</h4>
                        <p className="text-sm text-gray-600">
                          {att.seance.groupe.name} - Prof. {att.seance.professor.firstName}{' '}
                          {att.seance.professor.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(att.markedAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded font-bold ${
                          att.status === 'PRESENT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {att.status === 'PRESENT' ? 'Présent' : 'Absent'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
