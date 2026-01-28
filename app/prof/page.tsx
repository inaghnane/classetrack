'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { generateQRToken } from '@/lib/qr-generator';
import { QRCodeCanvas } from 'qrcode.react';

export default function ProfPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seances, setSeances] = useState<any[]>([]);
  const [selectedSeance, setSelectedSeance] = useState<any>(null);
  const [qrToken, setQrToken] = useState('');
  const [attendance, setAttendance] = useState<any>(null);
  const [frozenToken, setFrozenToken] = useState<string | null>(null);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'PROF') {
    router.push('/login');
    return null;
  }

  const fetchSeances = async () => {
    const res = await fetch('/api/prof/seances');
    const data = await res.json();
    setSeances(data);
  };

  const handleOpenSeance = async (seanceId: string) => {
    await fetch(`/api/prof/seances/${seanceId}/open`, { method: 'POST' });
    fetchSeances();
    setSelectedSeance(null);
  };

  const handleCloseSeance = async (seanceId: string) => {
    await fetch(`/api/prof/seances/${seanceId}/close`, { method: 'POST' });
    fetchSeances();
    setSelectedSeance(null);
  };

  const handleViewAttendance = async (seanceId: string) => {
    const res = await fetch(`/api/prof/seances/${seanceId}/attendance`);
    const data = await res.json();
    setAttendance(data);
  };

  useEffect(() => {
    fetchSeances();
  }, []);

  // Update QR token every 3 seconds
  useEffect(() => {
    if (selectedSeance?.status === 'OPEN' && selectedSeance?.qrSecret && !frozenToken) {
      const updateToken = () => {
        const token = generateQRToken(selectedSeance.id, selectedSeance.qrSecret);
        setQrToken(token);
      };
      updateToken();
      const interval = setInterval(updateToken, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSeance, frozenToken]);

  return (
    <>
      <Header />
      <main className="container">
        <h1 className="text-3xl font-bold mb-6">Mes Séances</h1>

        {!selectedSeance ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seances.map((seance) => (
              <div key={seance.id} className="card">
                <h3 className="font-bold text-lg mb-2">{seance.module.name}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Groupe: {seance.groupe.name}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  Salle: {seance.room}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  {new Date(seance.startsAt).toLocaleString('fr-FR')}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSeance(seance)}
                    className="btn-primary flex-1"
                  >
                    Détails
                  </button>
                  {seance.status === 'PLANNED' && (
                    <button
                      onClick={() => handleOpenSeance(seance.id)}
                      className="btn-primary flex-1"
                    >
                      Ouvrir
                    </button>
                  )}
                  {seance.status === 'OPEN' && (
                    <button
                      onClick={() => handleCloseSeance(seance.id)}
                      className="btn-danger flex-1"
                    >
                      Clôturer
                    </button>
                  )}
                </div>

                <div className="mt-2 text-center text-xs font-semibold">
                  Status: <span className="text-blue-600">{seance.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card max-w-2xl mx-auto">
            <button
              onClick={() => {
                setSelectedSeance(null);
                setAttendance(null);
              }}
              className="btn-secondary mb-4"
            >
              ← Retour
            </button>

            <h2 className="text-2xl font-bold mb-4">{selectedSeance.module.name}</h2>
            <p className="text-gray-600 mb-4">
              Groupe: {selectedSeance.groupe.name} | Salle: {selectedSeance.room} |
              Status: <span className="font-bold text-blue-600">{selectedSeance.status}</span>
            </p>

            {selectedSeance.status === 'OPEN' && selectedSeance.qrSecret && (
              <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                <div className="flex justify-between items-start mb-3">
                    <p className="text-sm text-gray-600">QR Code dynamique (fenêtres de 30s)</p>
                  <button
                    onClick={() => {
                      if (frozenToken) {
                        setFrozenToken(null);
                      } else {
                        setFrozenToken(qrToken);
                      }
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      frozenToken
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {frozenToken ? '🔒 Gelé - Cliquer pour dégeler' : '❄️ Geler pour scan'}
                  </button>
                </div>
                <div className="bg-white p-4 rounded border border-gray-200 flex flex-col items-center gap-3">
                  <QRCodeCanvas value={frozenToken || qrToken || '...'} size={220} level="M" includeMargin />
                  <div className="w-full text-center">
                    <p className="font-mono text-xs break-all mb-1">{frozenToken || qrToken}</p>
                    <p className="text-[11px] text-gray-500">
                      {frozenToken
                        ? '✓ QR gelé - Les étudiants peuvent scanner'
                        : '↻ Change toutes les 3 secondes'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedSeance.status === 'OPEN' && (
              <button
                onClick={() => handleCloseSeance(selectedSeance.id)}
                className="w-full btn-danger mb-4"
              >
                Clôturer cette séance
              </button>
            )}

            <button
              onClick={() => handleViewAttendance(selectedSeance.id)}
              className="w-full btn-primary mb-4"
            >
              Voir les présences
            </button>

            {attendance && (
              <div className="mt-4">
                <h3 className="font-bold text-lg mb-4">Présences</h3>

                <div className="mb-6">
                  <h4 className="font-semibold text-green-700 mb-2">
                    Présents ({attendance.present.length})
                  </h4>
                  <ul className="space-y-1">
                    {attendance.present.map((student: any) => (
                      <li key={student.id} className="p-2 bg-green-50 rounded">
                        {student.firstName} {student.lastName} ({student.email})
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-700 mb-2">
                    Absents ({attendance.absent.length})
                  </h4>
                  <ul className="space-y-1">
                    {attendance.absent.map((student: any) => (
                      <li key={student.id} className="p-2 bg-red-50 rounded">
                        {student.firstName} {student.lastName} ({student.email})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
