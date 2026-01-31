'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Seance {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  present: number;
  absent: number;
  total: number;
}

interface Groupe {
  groupe: { id: string; name: string };
  seances: Seance[];
}

interface Module {
  id: string;
  name: string;
  code: string;
  groupes: Groupe[];
}

interface Filiere {
  filiere: { id: string; name: string; code: string };
  modules: Module[];
}

interface Professor {
  professor: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  filieres: Filiere[];
}

export default function AdminSeancesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [hierarchy, setHierarchy] = useState<Professor[]>([]);
  const [expandedProf, setExpandedProf] = useState<string | null>(null);
  const [expandedFiliere, setExpandedFiliere] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchHierarchy();
    }
  }, [status]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'ADMIN') {
    router.push('/login');
    return null;
  }

  const fetchHierarchy = async () => {
    try {
      const res = await fetch('/api/admin/seances-hierarchy');
      const data = await res.json();
      setHierarchy(data);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    }
  };

  const totalSeances = hierarchy.reduce(
    (sum, prof) =>
      sum +
      prof.filieres.reduce(
        (fSum, fil) =>
          fSum +
          fil.modules.reduce(
            (mSum, mod) =>
              mSum + mod.groupes.reduce((gSum, grp) => gSum + grp.seances.length, 0),
            0
          ),
        0
      ),
    0
  );

  const statusBadge = (status: string) => {
    const badges: any = {
      PLANNED: { bg: 'bg-gray-100', text: 'text-gray-700', label: '📋 Planifiée' },
      OPEN: { bg: 'bg-green-100', text: 'text-green-700', label: '🟢 En cours' },
      CLOSED: { bg: 'bg-blue-100', text: 'text-blue-700', label: '⚫ Clôturée' },
    };
    const badge = badges[status] || badges.PLANNED;
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <>
      <Header />
      <main className="container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestion des Séances</h1>
          <button
            onClick={() => router.push('/admin')}
            className="btn-secondary"
          >
            ← Retour
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Total des séances:</strong> {totalSeances}
          </p>
        </div>

        <div className="space-y-4">
          {hierarchy.length === 0 ? (
            <p className="text-gray-600">Aucun professeur enregistré</p>
          ) : (
            hierarchy.map((prof) => {
              const profTotalSeances = prof.filieres.reduce(
                (sum, fil) =>
                  sum +
                  fil.modules.reduce(
                    (mSum, mod) =>
                      mSum +
                      mod.groupes.reduce((gSum, grp) => gSum + grp.seances.length, 0),
                    0
                  ),
                0
              );

              return (
                <div key={prof.professor.id} className="card">
                  {/* Professeur */}
                  <button
                    onClick={() =>
                      setExpandedProf(
                        expandedProf === prof.professor.id ? null : prof.professor.id
                      )
                    }
                    className="w-full flex justify-between items-center hover:bg-gray-50 p-2 rounded"
                  >
                    <div className="text-left">
                      <h3 className="font-bold text-lg">
                        {expandedProf === prof.professor.id ? '▼' : '▶'} {prof.professor.firstName}{' '}
                        {prof.professor.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{prof.professor.email}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-bold text-sm">
                      {profTotalSeances} séance(s)
                    </span>
                  </button>

                  {/* Filières du prof */}
                  {expandedProf === prof.professor.id && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      {prof.filieres.map((filiere) => {
                        const filiereTotalSeances = filiere.modules.reduce(
                          (sum, mod) =>
                            sum +
                            mod.groupes.reduce((gSum, grp) => gSum + grp.seances.length, 0),
                          0
                        );

                        return (
                          <div key={filiere.filiere.id} className="ml-4 bg-gray-50 rounded p-3">
                            {/* Filière */}
                            <button
                              onClick={() =>
                                setExpandedFiliere(
                                  expandedFiliere === filiere.filiere.id
                                    ? null
                                    : filiere.filiere.id
                                )
                              }
                              className="w-full flex justify-between items-center hover:bg-gray-100 p-2 rounded"
                            >
                              <div className="text-left">
                                <h4 className="font-bold">
                                  {expandedFiliere === filiere.filiere.id ? '▼' : '▶'}{' '}
                                  {filiere.filiere.name}
                                </h4>
                                <p className="text-xs text-gray-600">{filiere.filiere.code}</p>
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                                {filiereTotalSeances}
                              </span>
                            </button>

                            {/* Modules */}
                            {expandedFiliere === filiere.filiere.id && (
                              <div className="mt-3 space-y-3 border-t pt-3">
                                {filiere.modules.map((module) => {
                                  const moduleTotalSeances = module.groupes.reduce(
                                    (sum, grp) => sum + grp.seances.length,
                                    0
                                  );

                                  return (
                                    <div key={module.id} className="ml-4 bg-white rounded p-3 border border-gray-200">
                                      {/* Module */}
                                      <button
                                        onClick={() =>
                                          setExpandedModule(
                                            expandedModule === module.id ? null : module.id
                                          )
                                        }
                                        className="w-full flex justify-between items-center hover:bg-gray-50 p-2 rounded"
                                      >
                                        <div className="text-left">
                                          <h5 className="font-bold">
                                            {expandedModule === module.id ? '▼' : '▶'} {module.name}
                                          </h5>
                                          <p className="text-xs text-gray-600">{module.code}</p>
                                        </div>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold">
                                          {moduleTotalSeances}
                                        </span>
                                      </button>

                                      {/* Groupes & Séances */}
                                      {expandedModule === module.id && (
                                        <div className="mt-3 space-y-3 border-t pt-3">
                                          {module.groupes.map((groupe) => (
                                            <div key={groupe.groupe.id} className="ml-4">
                                              <h6 className="font-bold text-sm mb-2">
                                                👥 {groupe.groupe.name}
                                              </h6>
                                              <div className="space-y-2">
                                                {groupe.seances.map((seance) => (
                                                  <div
                                                    key={seance.id}
                                                    className="bg-gray-50 p-3 rounded border border-gray-200"
                                                  >
                                                    <div className="flex justify-between items-start mb-2">
                                                      <div>
                                                        <p className="font-semibold">
                                                          {new Date(seance.date).toLocaleDateString('fr-FR')} - {seance.startTime}-
                                                          {seance.endTime}
                                                        </p>
                                                      </div>
                                                      {statusBadge(seance.status)}
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                      <div className="bg-green-100 text-green-800 p-2 rounded font-bold">
                                                        ✅ Présent: {seance.present}
                                                      </div>
                                                      <div className="bg-red-100 text-red-800 p-2 rounded font-bold">
                                                        ❌ Absent: {seance.absent}
                                                      </div>
                                                      <div className="bg-blue-100 text-blue-800 p-2 rounded font-bold">
                                                        👥 Total: {seance.total}
                                                      </div>
                                                    </div>

                                                    {seance.total > 0 && (
                                                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                        <div
                                                          className="bg-green-500 h-full"
                                                          style={{
                                                            width: `${(seance.present / seance.total) * 100}%`,
                                                          }}
                                                        />
                                                      </div>
                                                    )}

                                                    {seance.status === 'CLOSED' && (
                                                      <button
                                                        onClick={() => window.open(`/api/prof/seances/${seance.id}/export-pdf`, '_blank')}
                                                        className="mt-3 w-full bg-blue-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-blue-700 transition"
                                                      >
                                                        📄 Télécharger le rapport PDF
                                                      </button>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
