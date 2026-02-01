'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineSyncBanner from '@/components/OfflineSyncBanner';
import { getOrCreateDeviceId } from '@/lib/device';

interface Seance {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  groupeName: string;
  groupeId: string;
}

interface Module {
  id: string;
  name: string;
  code: string;
  seances: Seance[];
}

interface HierarchyData {
  filiere: {
    id: string;
    name: string;
    code: string;
  };
  modules: Module[];
}

export default function StudentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Hierarchical navigation state
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedSeanceForScan, setSelectedSeanceForScan] = useState<Seance | null>(null);
  
  // States
  const [attendance, setAttendance] = useState<any[]>([]);
  const [justifications, setJustifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('modules');
  const [showScanner, setShowScanner] = useState(false);
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [selectedSeanceForJustif, setSelectedSeanceForJustif] = useState<Seance | null>(null);
  const [justificationReason, setJustificationReason] = useState('');
  const [justificationFile, setJustificationFile] = useState<File | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [_isClient, _setIsClient] = useState(false);
  const QrScanner = dynamic(() => import('@yudiel/react-qr-scanner').then((m) => m.QrScanner), {
    ssr: false,
  });
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    _setIsClient(true);
    try {
      const id = getOrCreateDeviceId();
      setDeviceId(id);
    } catch (error) {
      console.error('Device ID error:', error);
    }
  }, []);

  const fetchHierarchy = async () => {
    const res = await fetch('/api/student/hierarchy');
    const data = await res.json();
    setHierarchyData(data);
  };

  const fetchAttendance = async () => {
    const res = await fetch('/api/student/attendance');
    const data = await res.json();
    setAttendance(data);
  };

  const fetchJustifications = async () => {
    const res = await fetch('/api/student/justification');
    const data = await res.json();
    setJustifications(data);
  };

  const handleSubmitJustification = async () => {
    if (!selectedSeanceForJustif || !justificationReason.trim()) {
      setMessage({ type: 'error', text: 'Veuillez saisir une raison' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('seanceId', selectedSeanceForJustif.id);
      formData.append('reason', justificationReason);
      if (justificationFile) {
        formData.append('file', justificationFile);
      }

      const res = await fetch('/api/student/justification', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Justificatif soumis avec succès!' });
        setJustificationReason('');
        setJustificationFile(null);
        setSelectedSeanceForJustif(null);
        setShowJustificationModal(false);
        fetchJustifications();
      } else {
        const error = await res.json();
        setMessage({
          type: 'error',
          text: error.error || 'Erreur lors de la soumission',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({
        type: 'error',
        text: 'Erreur de connexion',
      });
    }
  };

  const handleScan = async () => {
    if (!selectedSeanceForScan || !tokenInput) {
      setMessage({ type: 'error', text: 'Saisir le token QR' });
      return;
    }

    try {
      const res = await fetch('/api/student/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seanceId: selectedSeanceForScan.id,
          token: tokenInput,
          scannedAt: new Date(),
          deviceId,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Présence marquée!' });
        setTokenInput('');
        setSelectedSeanceForScan(null);
        setShowScanner(false);
        setShowCamera(false);
        fetchHierarchy();
        fetchAttendance();
      } else {
        const error = await res.json();
        setMessage({
          type: 'error',
          text: error.error || 'Erreur lors du scan',
        });
      }
    } catch (error) {
      const queue = JSON.parse(localStorage.getItem('scanQueue') || '[]');
      queue.push({
        id: Math.random().toString(),
        seanceId: selectedSeanceForScan.id,
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
    fetchHierarchy();
    fetchAttendance();
    fetchJustifications();
  }, []);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'STUDENT') {
    router.push('/login');
    return null;
  }

  const presentSeanceIds = attendance
    .filter((a) => a.status === 'PRESENT')
    .map((a) => a.seanceId);
  const absentSeanceIds = attendance
    .filter((a) => a.status === 'ABSENT')
    .map((a) => a.seanceId);

  return (
    <>
      <Header />
      <OfflineSyncBanner />

      <main className="container">
        <h1 className="text-3xl font-bold mb-6">Mes Séances</h1>

        {/* Breadcrumb */}
        {hierarchyData && (
          <div className="mb-6 flex gap-2 items-center text-sm">
            <button
              onClick={() => setSelectedModule(null)}
              className="text-blue-600 hover:underline font-semibold"
            >
              {hierarchyData.filiere.name}
            </button>
            
            {selectedModule && (
              <>
                <span>→</span>
                <span className="font-semibold">{selectedModule.name}</span>
              </>
            )}
          </div>
        )}

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
            onClick={() => {
              setActiveTab('modules');
              setSelectedModule(null);
            }}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'modules'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Mes Modules
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
          <button
            onClick={() => setActiveTab('justificatifs')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'justificatifs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Justificatifs
          </button>
        </div>

        {activeTab === 'modules' && hierarchyData && (
          <div>
            {!selectedModule ? (
              /* Module Selection */
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {hierarchyData.filiere.name} - Tous les modules
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hierarchyData.modules.map((module) => {
                    const openSeances = module.seances.filter((s) => s.status === 'OPEN');
                    return (
                      <div
                        key={module.id}
                        onClick={() => setSelectedModule(module)}
                        className="card cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <h3 className="font-bold text-lg mb-2">{module.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">Code: {module.code}</p>
                        <div className="flex gap-2 text-xs flex-wrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {module.seances.length} séance(s)
                          </span>
                          {openSeances.length > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                              🟢 {openSeances.length} en cours
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Seance List */
              <div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="btn-secondary mb-4"
                >
                  ← Retour aux modules
                </button>

                <h2 className="text-xl font-bold mb-4">
                  {selectedModule.name} - Toutes les séances
                </h2>

                {selectedModule.seances.length === 0 ? (
                  <p className="text-gray-500">Aucune séance disponible pour ce module.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedModule.seances.map((seance) => {
                      const isPresent = presentSeanceIds.includes(seance.id);
                      const isAbsent = absentSeanceIds.includes(seance.id);
                      const isOpen = seance.status === 'OPEN';
                      const isClosed = seance.status === 'CLOSED';
                      const isPlanned = seance.status === 'PLANNED';
                      
                      return (
                        <div
                          key={seance.id}
                          className={`card ${isOpen ? 'border-2 border-green-500' : ''} ${
                            isPresent ? 'bg-green-50' : isAbsent ? 'bg-red-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-lg">
                                {new Date(seance.date).toLocaleDateString('fr-FR')}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {seance.startTime} - {seance.endTime}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Groupe: {seance.groupeName}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <span
                                className={`text-xs font-semibold px-3 py-1 rounded ${
                                  isOpen
                                    ? 'bg-green-100 text-green-700'
                                    : isClosed
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {isOpen ? '🟢 EN COURS' : isClosed ? '⚫ FERMÉE' : '📋 PLANIFIÉE'}
                              </span>
                              {isPresent && (
                                <span className="text-xs font-semibold px-3 py-1 rounded bg-green-200 text-green-900">
                                  ✅ Présent
                                </span>
                              )}
                              {isAbsent && (
                                <span className="text-xs font-semibold px-3 py-1 rounded bg-red-200 text-red-900">
                                  ❌ Absent
                                </span>
                              )}
                            </div>
                          </div>

                          {isOpen && !isPresent && (
                            <button
                              onClick={() => {
                                setSelectedSeanceForScan(seance);
                                setShowScanner(true);
                              }}
                              className="w-full btn-primary mt-3"
                            >
                              📷 Scanner le QR Code
                            </button>
                          )}

                          {isClosed && isAbsent && (
                            <button
                              onClick={() => {
                                setSelectedSeanceForJustif(seance);
                                setShowJustificationModal(true);
                              }}
                              className="w-full btn-secondary mt-3 border-2 border-orange-400 text-orange-700 hover:bg-orange-50"
                            >
                              📄 Soumettre un justificatif
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'historique' && (
          <div>
            <h2 className="font-bold text-xl mb-6">Historique de Présence</h2>
            
            {attendance.length === 0 ? (
              <p className="text-gray-600">Aucune présence enregistrée</p>
            ) : (
              <div className="space-y-8">
                {/* Regrouper par module */}
                {(() => {
                  const byModule = new Map<string, any>();
                  
                  attendance.forEach((att) => {
                    const moduleId = att.seance.module.id;
                    if (!byModule.has(moduleId)) {
                      byModule.set(moduleId, {
                        module: att.seance.module,
                        attendances: [],
                      });
                    }
                    byModule.get(moduleId)!.attendances.push(att);
                  });

                  return Array.from(byModule.values()).map((moduleData) => {
                    const presentCount = moduleData.attendances.filter((a: any) => a.status === 'PRESENT').length;
                    const absentCount = moduleData.attendances.filter((a: any) => a.status === 'ABSENT').length;

                    return (
                      <div key={moduleData.module.id} className="card bg-gray-50">
                        <h3 className="font-bold text-lg mb-2">{moduleData.module.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">Code: {moduleData.module.code}</p>
                        <div className="flex gap-4 mb-4">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-semibold text-sm">
                            ✅ {presentCount} présent(s)
                          </span>
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded font-semibold text-sm">
                            ❌ {absentCount} absent(s)
                          </span>
                        </div>

                        {/* Section Présents */}
                        {presentCount > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-green-700 mb-2">✅ Présences</h4>
                            <div className="space-y-2 pl-3 border-l-2 border-green-400">
                              {moduleData.attendances
                                .filter((att: any) => att.status === 'PRESENT')
                                .map((att: any) => (
                                  <div key={att.id} className="bg-green-50 p-3 rounded border border-green-200">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-sm font-semibold text-green-900">
                                          {new Date(att.seance.date).toLocaleDateString('fr-FR')} - {att.seance.startTime}
                                        </p>
                                        <p className="text-xs text-green-700">{att.seance.groupe.name}</p>
                                      </div>
                                      <span className="text-xs px-2 py-1 bg-green-200 text-green-900 rounded font-bold">
                                        Présent
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Section Absents */}
                        {absentCount > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-red-700 mb-2">❌ Absences</h4>
                            <div className="space-y-2 pl-3 border-l-2 border-red-400">
                              {moduleData.attendances
                                .filter((att: any) => att.status === 'ABSENT')
                                .map((att: any) => (
                                  <div key={att.id} className="bg-red-50 p-3 rounded border border-red-200">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-sm font-semibold text-red-900">
                                          {new Date(att.seance.date).toLocaleDateString('fr-FR')} - {att.seance.startTime}
                                        </p>
                                        <p className="text-xs text-red-700">{att.seance.groupe.name}</p>
                                      </div>
                                      <span className="text-xs px-2 py-1 bg-red-200 text-red-900 rounded font-bold">
                                        Absent
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'justificatifs' && (
          <div>
            <h2 className="font-bold text-xl mb-4">Mes Justificatifs</h2>
            <div className="space-y-3">
              {justifications.length === 0 ? (
                <p className="text-gray-600">Aucun justificatif soumis</p>
              ) : (
                justifications.map((justif) => (
                  <div key={justif.id} className="card">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold">{justif.seance.module.name}</h4>
                        <p className="text-sm text-gray-600">
                          {justif.seance.groupe.name} - {new Date(justif.seance.date).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Soumis le {new Date(justif.createdAt).toLocaleString('fr-FR')}
                        </p>
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
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Votre commentaire:</strong> {justif.reason}
                    </p>
                    {justif.fileUrl && (
                      <a
                        href={justif.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm block mb-2"
                      >
                        📎 Voir le fichier joint
                      </a>
                    )}
                    {justif.adminComment && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p className="text-xs font-semibold text-blue-900 mb-1">
                          💬 Retour du professeur:
                        </p>
                        <p className="text-sm text-blue-800">
                          {justif.adminComment}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Justification Modal */}
      {showJustificationModal && selectedSeanceForJustif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Justificatif d'Absence</h3>
              <button
                onClick={() => {
                  setShowJustificationModal(false);
                  setJustificationReason('');
                  setJustificationFile(null);
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm font-semibold mb-1">Séance concernée:</p>
              <p className="text-sm text-gray-700">
                {new Date(selectedSeanceForJustif.date).toLocaleDateString('fr-FR')} - {selectedSeanceForJustif.startTime}
              </p>
              <p className="text-xs text-gray-600">Groupe: {selectedSeanceForJustif.groupeName}</p>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">
                Votre commentaire / Raison de l'absence *
              </label>
              <textarea
                value={justificationReason}
                onChange={(e) => setJustificationReason(e.target.value)}
                placeholder="Expliquez la raison de votre absence en détail..."
                rows={4}
                className="input-field resize-none"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                💡 Soyez précis: maladie, problème familial, rendez-vous médical, etc.
              </p>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">
                Pièce justificative (PDF ou image)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Vérifier la taille (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      setMessage({ type: 'error', text: 'Fichier trop volumineux (max 5MB)' });
                      e.target.value = '';
                      return;
                    }
                    setJustificationFile(file);
                  }
                }}
                className="input-field"
              />
              <p className="text-xs text-gray-600 mt-1">
                💡 Formats acceptés: PDF, JPG, PNG (max 5MB)
              </p>
              {justificationFile && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Fichier sélectionné: {justificationFile.name}
                </p>
              )}
            </div>

            <button
              onClick={handleSubmitJustification}
              disabled={!justificationReason.trim()}
              className="w-full btn-primary font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📤 Soumettre le justificatif
            </button>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && selectedSeanceForScan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Scanner QR Code</h3>
              <button
                onClick={() => {
                  setShowScanner(false);
                  setShowCamera(false);
                  setTokenInput('');
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Séance: {new Date(selectedSeanceForScan.date).toLocaleDateString('fr-FR')} - {selectedSeanceForScan.startTime}
            </p>

            {/* Méthode 1: Caméra */}
            <div className="mb-4 p-3 bg-green-50 rounded border-2 border-green-400">
              <label className="block font-bold mb-2 text-green-900">
                📷 Scan avec caméra (recommandé)
              </label>
              {showCamera ? (
                <>
                  <div className="rounded overflow-hidden border-2 border-gray-200 mb-2">
                    <QrScanner
                      onDecode={(result) => {
                        const value = Array.isArray(result) ? result[0] : result;
                        if (value) {
                          setTokenInput(value);
                          setMessage({ type: 'success', text: 'QR scanné! Cliquez sur Valider.' });
                        }
                      }}
                      onError={(err) => {
                        console.error(err);
                        setMessage({ type: 'warning', text: 'Caméra indisponible' });
                      }}
                      constraints={{ facingMode: 'environment' }}
                      scanDelay={800}
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
                  Activer caméra
                </button>
              )}
            </div>

            {/* Méthode 2: Saisie manuelle */}
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
              <label className="block font-semibold mb-2 text-gray-700">
                Ou saisir le token manuellement
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Coller le token"
                className="input-field font-mono text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">
                💡 Si caméra ne marche pas, demandez au prof de geler le QR
              </p>
            </div>

            <button
              onClick={handleScan}
              disabled={!tokenInput}
              className="w-full btn-primary font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✓ Valider la présence
            </button>
          </div>
        </div>
      )}
    </>
  );
}
