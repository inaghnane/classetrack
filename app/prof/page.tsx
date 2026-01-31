'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { generateQRToken } from '@/lib/qr-generator';
import { QRCodeCanvas } from 'qrcode.react';

interface Seance {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  qrSecret?: string;
  qrFrozen: boolean;
}

interface Groupe {
  id: string;
  name: string;
  seances: Seance[];
}

interface Module {
  id: string;
  name: string;
  code: string;
  groupes: Groupe[];
}

interface Filiere {
  id: string;
  name: string;
  code: string;
  modules: Module[];
}

export default function ProfPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Navigation states
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState<Filiere | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedGroupe, setSelectedGroupe] = useState<Groupe | null>(null);
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);
  
  // Display states
  const [qrToken, setQrToken] = useState('');
  const [attendance, setAttendance] = useState<any>(null);
  const [qrFrozen, setQrFrozen] = useState(false);
  const [showCreateSeance, setShowCreateSeance] = useState(false);
  const [selectedFiliereForCreate, setSelectedFiliereForCreate] = useState<string>('');
  const [newSeance, setNewSeance] = useState({
    date: '',
    startTime: '',
    endTime: '',
    moduleId: '',
    groupeId: '',
  });
  const [isCreatingSeance, setIsCreatingSeance] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'PROF') {
    router.push('/login');
    return null;
  }

  const fetchHierarchy = async () => {
    const res = await fetch('/api/prof/hierarchy');
    const data = await res.json();
    setFilieres(data);
  };

  const handleOpenSeance = async (seanceId: string) => {
    const res = await fetch(`/api/prof/seances/${seanceId}/open`, { method: 'POST' });
    if (res.ok) {
      const updatedSeance = await res.json();
      if (selectedSeance) {
        setSelectedSeance({ 
          ...selectedSeance, 
          status: 'OPEN', 
          qrSecret: updatedSeance.qrSecret,
          qrFrozen: updatedSeance.qrFrozen || false
        });
        setQrFrozen(updatedSeance.qrFrozen || false);
      }
    }
  };

  const handleCloseSeance = async (seanceId: string) => {
    await fetch(`/api/prof/seances/${seanceId}/close`, { method: 'POST' });
    if (selectedSeance) {
      setSelectedSeance({ ...selectedSeance, status: 'CLOSED' });
    }
  };

  const handleViewAttendance = async (seanceId: string) => {
    const res = await fetch(`/api/prof/seances/${seanceId}/attendance`);
    const data = await res.json();
    setAttendance(data);
  };

  const handleFreezeQR = async (seanceId: string, freeze: boolean) => {
    const res = await fetch(`/api/prof/seances/${seanceId}/freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frozen: freeze }),
    });
    if (res.ok) {
      setQrFrozen(freeze);
      alert(freeze
        ? 'QR gelé ! Il ne changera plus. (Appuyez à nouveau pour dégeler)'
        : 'QR dégelé ! Il change à nouveau toutes les 3 secondes.'
      );
    }
  };

  const handleDownloadPDF = async (seanceId: string, moduleName: string) => {
    try {
      window.open(`/api/prof/seances/${seanceId}/export-pdf`, '_blank');
    } catch (error) {
      console.error('PDF error:', error);
      alert("Erreur lors de l'ouverture du rapport");
    }
  };

  const handleCreateSeance = async () => {
    if (!newSeance.moduleId || !newSeance.groupeId || !newSeance.date || !newSeance.startTime || !newSeance.endTime) {
      setMessage({ type: 'error', text: 'Tous les champs sont requis' });
      return;
    }

    if (isCreatingSeance) return;
    setIsCreatingSeance(true);

    try {
      const res = await fetch('/api/prof/seances/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeance),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Séance créée avec succès!' });
        setShowCreateSeance(false);
        setNewSeance({
          date: '',
          startTime: '',
          endTime: '',
          moduleId: '',
          groupeId: '',
        });
        fetchHierarchy();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Erreur' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setIsCreatingSeance(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  useEffect(() => {
    if (selectedSeance?.status === 'OPEN' && selectedSeance?.qrSecret) {
      if (qrFrozen) {
        const token = generateQRToken(selectedSeance.id, selectedSeance.qrSecret);
        setQrToken(token);
        return;
      }

      const updateToken = () => {
        const token = generateQRToken(selectedSeance.id, selectedSeance.qrSecret);
        setQrToken(token);
      };
      updateToken();
      const interval = setInterval(updateToken, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSeance, qrFrozen]);

  return (
    <>
      <Header />
      <main className="container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Mes Séances</h1>
          <button
            onClick={() => setShowCreateSeance(true)}
            className="btn-primary"
          >
            ➕ Créer une séance
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

        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex gap-2 items-center text-sm">
          <button
            onClick={() => {
              setSelectedFiliere(null);
              setSelectedModule(null);
              setSelectedGroupe(null);
              setSelectedSeance(null);
              setAttendance(null);
            }}
            className="text-blue-600 hover:underline font-semibold"
          >
            Filières
          </button>
          
          {selectedFiliere && (
            <>
              <span></span>
              <button
                onClick={() => {
                  setSelectedModule(null);
                  setSelectedGroupe(null);
                  setSelectedSeance(null);
                  setAttendance(null);
                }}
                className="text-blue-600 hover:underline"
              >
                {selectedFiliere.name}
              </button>
            </>
          )}
          
          {selectedModule && (
            <>
              <span></span>
              <button
                onClick={() => {
                  setSelectedGroupe(null);
                  setSelectedSeance(null);
                  setAttendance(null);
                }}
                className="text-blue-600 hover:underline"
              >
                {selectedModule.name}
              </button>
            </>
          )}
          
          {selectedGroupe && (
            <>
              <span></span>
              <button
                onClick={() => {
                  setSelectedSeance(null);
                  setAttendance(null);
                }}
                className="text-blue-600 hover:underline"
              >
                {selectedGroupe.name}
              </button>
            </>
          )}
          
          {selectedSeance && (
            <>
              <span></span>
              <span className="font-semibold">{selectedSeance.startTime}</span>
            </>
          )}
        </div>

        {/* Step 1: Select Filiere */}
        {!selectedFiliere ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filieres.map((filiere) => (
              <div
                key={filiere.id}
                onClick={() => setSelectedFiliere(filiere)}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-lg mb-2">{filiere.name}</h3>
                <p className="text-sm text-gray-600 mb-3">Code: {filiere.code}</p>
                <p className="text-xs text-gray-500">
                  {filiere.modules.reduce((sum: number, m: Module) => sum + m.groupes.length, 0)} groupe(s)
                </p>
              </div>
            ))}
          </div>
        ) : !selectedModule ? (
          /* Step 2: Select Module */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFiliere.modules.map((module) => (
              <div
                key={module.id}
                onClick={() => setSelectedModule(module)}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-lg mb-2">{module.name}</h3>
                <p className="text-sm text-gray-600 mb-3">Code: {module.code}</p>
                <p className="text-xs text-gray-500">
                  {module.groupes.length} groupe(s)
                </p>
              </div>
            ))}
          </div>
        ) : !selectedGroupe ? (
          /* Step 3: Select Groupe */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedModule.groupes.map((groupe) => (
              <div
                key={groupe.id}
                onClick={() => setSelectedGroupe(groupe)}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-lg mb-2">{groupe.name}</h3>
                <p className="text-xs text-gray-500">
                  {groupe.seances.length} séance(s)
                </p>
              </div>
            ))}
          </div>
        ) : !selectedSeance ? (
          /* Step 4: Select Seance */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedGroupe.seances.map((seance) => (
              <div
                key={seance.id}
                onClick={() => setSelectedSeance(seance)}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-lg mb-2">
                  {new Date(seance.date).toLocaleDateString('fr-FR')}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Horaire: {seance.startTime} - {seance.endTime}
                </p>
                <div className="flex gap-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {seance.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Step 5: Seance Details */
          <div className="card max-w-2xl mx-auto">
            <button
              onClick={() => {
                setSelectedSeance(null);
                setAttendance(null);
              }}
              className="btn-secondary mb-4"
            >
              ← Retour aux séances
            </button>

            <h2 className="text-2xl font-bold mb-4">
              {selectedModule?.name} - {selectedGroupe?.name}
            </h2>
            <p className="text-gray-600 mb-4">
              Date: {new Date(selectedSeance.date).toLocaleDateString('fr-FR')} |
              Horaire: {selectedSeance.startTime} - {selectedSeance.endTime} |
              Status: <span className="font-bold text-blue-600">{selectedSeance.status}</span>
            </p>

            {selectedSeance.status === 'PLANNED' && (
              <button
                onClick={() => handleOpenSeance(selectedSeance.id)}
                className="w-full btn-primary mb-4"
              >
                🚀 Ouvrir la séance (générer QR)
              </button>
            )}

            {selectedSeance.status === 'OPEN' && (
              <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-gray-600 mb-3">Les étudiants peuvent maintenant marquer leur présence.</p>
                {selectedSeance.qrSecret && (
                  <div className="bg-white p-4 rounded border border-gray-200 flex flex-col items-center gap-3">
                    <QRCodeCanvas value={qrToken || ''} size={220} level="M" includeMargin />
                    <div className="w-full text-center">
                      <p className="font-mono text-xs break-all mb-1">{qrToken}</p>
                      <p className="text-[11px] text-gray-500">
                        {qrFrozen ? '❄️ QR gelé - ne change pas' : '↻ Change toutes les 3 secondes | Valide 5 min'}
                      </p>
                    </div>

                    <div className="w-full flex gap-2 mt-4 pt-4 border-t border-gray-300">
                      <button
                        onClick={() => handleFreezeQR(selectedSeance.id, !qrFrozen)}
                        className={`w-full px-3 py-2 rounded text-sm font-semibold ${
                          qrFrozen
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                      >
                        {qrFrozen ? '☀️ Dégeler' : '❄️ Geler QR'}
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-2">
                      💡 Gelé le QR en cas de problème caméra ou connexion
                    </p>
                  </div>
                )}
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

            {selectedSeance.status === 'CLOSED' && (
              <div className="mb-4 p-4 bg-green-50 rounded border border-green-200">
                <p className="text-green-700 font-semibold mb-3">✅ Séance clôturée</p>
                <button
                  onClick={() => handleDownloadPDF(selectedSeance.id, selectedModule?.name || 'rapport')}
                  className="w-full btn-primary"
                >
                  📄 Télécharger le rapport (PDF)
                </button>
              </div>
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

      {/* Modal création séance */}
      {showCreateSeance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Créer une séance</h3>
              <button
                onClick={() => {
                  setShowCreateSeance(false);
                  setSelectedFiliereForCreate('');
                  setNewSeance({
                    date: '',
                    startTime: '',
                    endTime: '',
                    moduleId: '',
                    groupeId: '',
                  });
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2">Filière</label>
              <select
                value={selectedFiliereForCreate}
                onChange={(e) => {
                  setSelectedFiliereForCreate(e.target.value);
                  setNewSeance({ ...newSeance, moduleId: '', groupeId: '' });
                }}
                className="input-field"
              >
                <option value="">Sélectionner une filière</option>
                {filieres.map((filiere) => (
                  <option key={filiere.id} value={filiere.id}>
                    {filiere.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedFiliereForCreate && (
              <div className="mb-4">
                <label className="block font-semibold mb-2">Module</label>
                <select
                  value={newSeance.moduleId}
                  onChange={(e) => {
                    setNewSeance({ ...newSeance, moduleId: e.target.value, groupeId: '' });
                  }}
                  className="input-field"
                >
                  <option value="">Sélectionner un module</option>
                  {filieres
                    .find(f => f.id === selectedFiliereForCreate)
                    ?.modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.name} ({module.code})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {newSeance.moduleId && (
              <div className="mb-4">
                <label className="block font-semibold mb-2">Groupe</label>
                <select
                  value={newSeance.groupeId}
                  onChange={(e) => setNewSeance({ ...newSeance, groupeId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Sélectionner un groupe</option>
                  {filieres
                    .find(f => f.id === selectedFiliereForCreate)
                    ?.modules.find(m => m.id === newSeance.moduleId)
                    ?.groupes.map((groupe) => (
                      <option key={groupe.id} value={groupe.id}>
                        {groupe.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block font-semibold mb-2">Date</label>
              <input
                type="date"
                value={newSeance.date}
                onChange={(e) => setNewSeance({ ...newSeance, date: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block font-semibold mb-2 text-sm">Heure début</label>
                <input
                  type="time"
                  value={newSeance.startTime}
                  onChange={(e) =>
                    setNewSeance({ ...newSeance, startTime: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">Heure fin</label>
                <input
                  type="time"
                  value={newSeance.endTime}
                  onChange={(e) =>
                    setNewSeance({ ...newSeance, endTime: e.target.value })
                  }
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateSeance(false);
                  setSelectedFiliereForCreate('');
                  setNewSeance({
                    date: '',
                    startTime: '',
                    endTime: '',
                    moduleId: '',
                    groupeId: '',
                  });
                }}
                className="flex-1 btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateSeance}
                disabled={isCreatingSeance}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingSeance ? '⏳ Création...' : '✅ Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
