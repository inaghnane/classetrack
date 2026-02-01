'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('user');

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (status === 'unauthenticated' || (session?.user as any)?.role !== 'ADMIN') {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Header />
      <main className="container">
        <h1 className="text-3xl font-bold mb-6">Panneau Admin</h1>

        <div className="flex gap-4 mb-6 border-b">
          {['user', 'professor', 'filiere', 'module', 'groupe', 'enrollment', 'seance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'professor' ? 'Professeurs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="card">
          {activeTab === 'user' && <Adminuser />}
          {activeTab === 'professor' && <AdminProfessor />}
          {activeTab === 'filiere' && <Adminfiliere />}
          {activeTab === 'module' && <Adminmodule />}
          {activeTab === 'groupe' && <Admingroupe />}
          {activeTab === 'enrollment' && <Adminenrollment />}
          {activeTab === 'seance' && <Adminseance />}
        </div>
      </main>
    </>
  );
}

function Adminuser() {
  const [user, setuser] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'STUDENT',
  });
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUser, setEditUser] = useState({
    firstName: '',
    lastName: '',
    role: 'STUDENT',
    password: '',
  });

  const fetchuser = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/user');
    const data = await res.json();
    setuser(data);
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    setNewUser({ email: '', firstName: '', lastName: '', password: '', role: 'STUDENT' });
    fetchuser();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Confirmer la suppression?')) {
      await fetch(`/api/admin/user/${id}`, { method: 'DELETE' });
      fetchuser();
    }
  };

  const handleEditUser = (u: any) => {
    setEditingUser(u);
    setEditUser({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      role: u.role || 'STUDENT',
      password: '',
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await fetch(`/api/admin/user/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editUser),
    });
    setEditingUser(null);
    setEditUser({ firstName: '', lastName: '', role: 'STUDENT', password: '' });
    fetchuser();
  };

  return (
    <div>
      <button
        onClick={fetchuser}
        disabled={loading}
        className="btn-primary mb-4"
      >
        {loading ? 'Chargement...' : 'Charger les utilisateurs'}
      </button>

      <form onSubmit={handleAddUser} className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-4">Ajouter un utilisateur</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="input-field"
            required
          />
          <input
            type="text"
            placeholder="Prénom"
            value={newUser.firstName}
            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
            className="input-field"
            required
          />
          <input
            type="text"
            placeholder="Nom"
            value={newUser.lastName}
            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="input-field"
            required
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="input-field"
          >
            <option value="STUDENT">Étudiant</option>
            <option value="PROF">Professeur</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" className="btn-primary">
            Ajouter
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Nom</th>
              <th className="border p-2 text-left">Rôle</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {user.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.firstName} {user.lastName}</td>
                <td className="border p-2">{user.role}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="btn-secondary text-sm mr-2"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="btn-danger text-sm"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Modifier l'utilisateur</h3>
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <input
                type="text"
                placeholder="Prénom"
                value={editUser.firstName}
                onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Nom"
                value={editUser.lastName}
                onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                className="input-field"
                required
              />
              <select
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                className="input-field"
              >
                <option value="STUDENT">Étudiant</option>
                <option value="PROF">Professeur</option>
                <option value="ADMIN">Admin</option>
              </select>
              <input
                type="password"
                placeholder="Nouveau mot de passe (optionnel)"
                value={editUser.password}
                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                className="input-field"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminProfessor() {
  const [professors, setProfessors] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProf, setSelectedProf] = useState<any | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  const fetchProfessors = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/user');
    const data = await res.json();
    setProfessors(data.filter((u: any) => u.role === 'PROF'));
    setLoading(false);
  };

  const fetchModules = async () => {
    const [moduleRes, groupeRes] = await Promise.all([
      fetch('/api/admin/module'),
      fetch('/api/admin/groupe'),
    ]);
    const moduleData = await moduleRes.json();
    const groupeData = await groupeRes.json();
    setModules(moduleData);
    setGroupes(groupeData);
  };

  const handleImportProfessors = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportMessage(null);

    if (!importFile) {
      setImportMessage('Veuillez sélectionner un fichier Excel');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    const res = await fetch('/api/admin/professor/import', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setImportMessage(
        `✅ Import terminé: ${data.created} créés, ${data.updated} mis à jour, ${data.skipped} ignorés.`
      );
      setImportFile(null);
      fetchProfessors();
    } else {
      setImportMessage(`❌ ${data.error || 'Erreur lors de l\'import'}`);
    }
    setImporting(false);
  };

  const handleResetPassword = async (profId: string) => {
    if (!confirm('Réinitialiser le mot de passe à Prof@12345?')) return;

    const res = await fetch(`/api/admin/user/${profId}/reset-password`, {
      method: 'POST',
    });

    if (res.ok) {
      alert('✅ Mot de passe réinitialisé à Prof@12345');
    } else {
      alert('❌ Erreur');
    }
  };

  const openAssignModal = (prof: any) => {
    setSelectedProf(prof);
    const existingAssignments = (prof.professorAssignments || []).map(
      (a: any) => `${a.moduleId}:${a.groupeId}`
    );
    setSelectedAssignments(existingAssignments);
    setAssignMessage(null);
    setShowAssignModal(true);
  };

  const handleToggleAssignment = (moduleId: string, groupeId: string) => {
    const key = `${moduleId}:${groupeId}`;
    setSelectedAssignments((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedProf) return;
    setAssignSaving(true);
    setAssignMessage(null);

    const assignments = selectedAssignments.map((key) => {
      const [moduleId, groupeId] = key.split(':');
      return { moduleId, groupeId };
    });

    const res = await fetch(`/api/admin/professor/${selectedProf.id}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments }),
    });

    if (res.ok) {
      setAssignMessage('✅ Assignations enregistrées');
      await fetchProfessors();
      setShowAssignModal(false);
    } else {
      const data = await res.json();
      setAssignMessage(`❌ ${data.error || 'Erreur lors de l\'assignation'}`);
    }

    setAssignSaving(false);
  };

  return (
    <div>
      <button
        onClick={() => {
          fetchProfessors();
          fetchModules();
        }}
        className="btn-primary mb-4"
      >
        Charger les professeurs
      </button>

      {/* Import Excel */}
      <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
        <h3 className="font-bold mb-4">📥 Importer des professeurs (Excel)</h3>
        <p className="text-sm text-gray-600 mb-3">
          Format: <code className="bg-gray-200 px-2 py-1 rounded">Email | Prenom | Nom | Modules | Filiere | Groupes</code>
        </p>
        <form onSubmit={handleImportProfessors} className="flex gap-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={importing || !importFile}
            className="btn-primary"
          >
            {importing ? '⏳ Import...' : '📥 Importer'}
          </button>
        </form>
        {importMessage && (
          <p className={`mt-2 text-sm font-semibold ${importMessage.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>
            {importMessage}
          </p>
        )}
      </div>

      {/* Liste des professeurs */}
      {loading ? (
        <p>Chargement...</p>
      ) : professors.length === 0 ? (
        <p className="text-gray-600">Aucun professeur enregistré</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Nom</th>
                <th className="border p-2 text-left">Prénom</th>
                <th className="border p-2 text-left">Modules assignés</th>
                <th className="border p-2 text-left">Filières</th>
                <th className="border p-2 text-left">Groupes</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {professors.map((prof) => (
                <tr key={prof.id} className="border-b hover:bg-gray-50">
                  <td className="border p-2">{prof.email}</td>
                  <td className="border p-2">{prof.lastName}</td>
                  <td className="border p-2">{prof.firstName}</td>
                  <td className="border p-2 text-sm text-gray-600">
                    {prof.professorAssignments?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {Array.from(
                          new Set(
                            prof.professorAssignments
                              .map((a: any) => a.module?.name)
                              .filter(Boolean)
                          )
                        ).map((name: any) => (
                          <span key={name} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">Aucun</span>
                    )}
                  </td>
                  <td className="border p-2 text-sm text-gray-600">
                    {prof.professorAssignments?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {Array.from(
                          new Set(
                            prof.professorAssignments
                              .map((a: any) => a.module?.filiere?.name)
                              .filter(Boolean)
                          )
                        ).map((name: any) => (
                          <span key={name} className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="border p-2 text-sm text-gray-600">
                    {prof.professorAssignments?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {Array.from(
                          new Set(
                            prof.professorAssignments
                              .map((a: any) => a.groupe?.name)
                              .filter(Boolean)
                          )
                        ).map((name: any) => (
                          <span key={name} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => openAssignModal(prof)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded mr-2"
                    >
                      📚 Assigner modules
                    </button>
                    <button
                      onClick={() => handleResetPassword(prof.id)}
                      className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                    >
                      🔒 Réinitialiser MDP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAssignModal && selectedProf && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2">
              Assigner des modules à {selectedProf.firstName} {selectedProf.lastName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez un ou plusieurs modules (les filières seront déduites automatiquement).
            </p>

            <div className="space-y-4">
              {modules.length === 0 ? (
                <p className="text-gray-600">Aucun module disponible.</p>
              ) : (
                Object.values(
                  modules.reduce((acc: any, module: any) => {
                    const filiereName = module.filiere?.name || 'Sans filière';
                    if (!acc[filiereName]) acc[filiereName] = [];
                    acc[filiereName].push(module);
                    return acc;
                  }, {})
                ).map((group: any, idx: number) => {
                  const filiereName = group[0]?.filiere?.name || 'Sans filière';
                  const filiereId = group[0]?.filiere?.id;
                  const filiereGroupes = groupes.filter((g: any) => g.filiereId === filiereId);

                  return (
                    <div key={`${filiereName}-${idx}`} className="border rounded p-3">
                      <h4 className="font-semibold text-sm mb-2">{filiereName}</h4>
                      <div className="space-y-3">
                        {group.map((module: any) => (
                          <div key={module.id} className="border rounded p-3">
                            <p className="text-sm font-semibold mb-2">{module.name} ({module.code})</p>
                            {filiereGroupes.length === 0 ? (
                              <p className="text-xs text-gray-500">Aucun groupe pour cette filière.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {filiereGroupes.map((g: any) => {
                                  const key = `${module.id}:${g.id}`;
                                  return (
                                    <label key={key} className="flex items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={selectedAssignments.includes(key)}
                                        onChange={() => handleToggleAssignment(module.id, g.id)}
                                      />
                                      <span>{g.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {assignMessage && (
              <p className={`mt-3 text-sm font-semibold ${assignMessage.startsWith('✅') ? 'text-green-700' : 'text-red-700'}`}>
                {assignMessage}
              </p>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveAssignments}
                disabled={assignSaving}
                className="btn-primary"
              >
                {assignSaving ? '⏳ Enregistrement...' : '✅ Enregistrer'}
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Adminfiliere() {
  const [filiere, setfiliere] = useState<any[]>([]);
  const [newName, setNewName] = useState('');

  const fetchfiliere = async () => {
    const res = await fetch('/api/admin/filiere');
    const data = await res.json();
    setfiliere(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/filiere', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    setNewName('');
    fetchfiliere();
  };

  return (
    <div>
      <button onClick={fetchfiliere} className="btn-primary mb-4">
        Charger les filière
      </button>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Nom filière"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary">
          Ajouter
        </button>
      </form>
      <ul>
        {filiere.map((f) => (
          <li key={f.id} className="p-2 border-b">
            {f.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Admingroupe() {
  const [groupe, setgroupe] = useState<any[]>([]);
  const [filiere, setfiliere] = useState<any[]>([]);
  const [newGroupe, setNewGroupe] = useState({ name: '', filiereId: '' });

  const fetchgroupe = async () => {
    const res = await fetch('/api/admin/groupe');
    const data = await res.json();
    setgroupe(data);
  };

  const fetchfiliere = async () => {
    const res = await fetch('/api/admin/filiere');
    const data = await res.json();
    setfiliere(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/groupe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroupe),
    });
    setNewGroupe({ name: '', filiereId: '' });
    fetchgroupe();
  };

  return (
    <div>
      <button
        onClick={() => {
          fetchgroupe();
          fetchfiliere();
        }}
        className="btn-primary mb-4"
      >
        Charger les groupe
      </button>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Nom groupe"
          value={newGroupe.name}
          onChange={(e) => setNewGroupe({ ...newGroupe, name: e.target.value })}
          className="input-field flex-1"
        />
        <select
          value={newGroupe.filiereId}
          onChange={(e) => setNewGroupe({ ...newGroupe, filiereId: e.target.value })}
          className="input-field flex-1"
        >
          <option value="">Sélectionner filière</option>
          {filiere.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          Ajouter
        </button>
      </form>
      <ul>
        {groupe.map((g) => (
          <li key={g.id} className="p-2 border-b">
            {g.name} ({g.filiere.name})
          </li>
        ))}
      </ul>
    </div>
  );
}

function Adminmodule() {
  const [module, setmodule] = useState<any[]>([]);
  const [filiere, setfiliere] = useState<any[]>([]);
  const [newModule, setNewModule] = useState({ name: '', filiereId: '' });

  const fetchmodule = async () => {
    const res = await fetch('/api/admin/module');
    const data = await res.json();
    setmodule(data);
  };

  const fetchfiliere = async () => {
    const res = await fetch('/api/admin/filiere');
    const data = await res.json();
    setfiliere(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/module', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newModule),
    });
    setNewModule({ name: '', filiereId: '' });
    fetchmodule();
  };

  return (
    <div>
      <button
        onClick={() => {
          fetchmodule();
          fetchfiliere();
        }}
        className="btn-primary mb-4"
      >
        Charger les module
      </button>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Nom module"
          value={newModule.name}
          onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
          className="input-field flex-1"
        />
        <select
          value={newModule.filiereId}
          onChange={(e) => setNewModule({ ...newModule, filiereId: e.target.value })}
          className="input-field flex-1"
        >
          <option value="">Sélectionner filière</option>
          {filiere.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">
          Ajouter
        </button>
      </form>
      <ul>
        {module.map((m) => (
          <li key={m.id} className="p-2 border-b">
            {m.name} ({m.filiere.name})
          </li>
        ))}
      </ul>
    </div>
  );
}

function Adminseance() {
  const [seance, setseance] = useState<any[]>([]);
  const [filiere, setfiliere] = useState<any[]>([]);
  const [module, setmodule] = useState<any[]>([]);
  const [groupe, setgroupe] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [seanceMessage, setSeanceMessage] = useState<{ type: string; text: string } | null>(null);
  const [newSeance, setNewSeance] = useState({
    filiereId: '',
    moduleId: '',
    groupeId: '',
    profId: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const fetchseance = async () => {
    const res = await fetch('/api/admin/seance');
    const data = await res.json();
    setseance(data);
  };

  const loadLists = async () => {
    const [filiereRes, moduleRes, groupeRes, userRes] = await Promise.all([
      fetch('/api/admin/filiere'),
      fetch('/api/admin/module'),
      fetch('/api/admin/groupe'),
      fetch('/api/admin/user'),
    ]);

    const filiereData = await filiereRes.json();
    const moduleData = await moduleRes.json();
    const groupeData = await groupeRes.json();
    const userData = await userRes.json();

    setfiliere(filiereData);
    setmodule(moduleData);
    setgroupe(groupeData);
    setProfessors(userData.filter((u: any) => u.role === 'PROF'));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeanceMessage(null);
    const { filiereId, ...seanceData } = newSeance; // Exclure filiereId
    const res = await fetch('/api/admin/seance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seanceData),
    });
    if (res.ok) {
      setSeanceMessage({ type: 'success', text: '✅ Séance créée avec succès' });
      setNewSeance({
        filiereId: '',
        moduleId: '',
        groupeId: '',
        profId: '',
        date: '',
        startTime: '',
        endTime: '',
      });
      fetchseance();
    } else {
      const error = await res.json();
      setSeanceMessage({ type: 'error', text: `❌ Erreur: ${error.error || error.message || 'Impossible de créer la séance'}` });
      console.error('Erreur création séance:', error);
    }
  };

  return (
    <div>
      <button
        onClick={() => {
          fetchseance();
          loadLists();
        }}
        className="btn-primary mb-4"
      >
        Charger les séances
      </button>

      {seanceMessage && (
        <div
          className={`mb-4 p-4 rounded border-l-4 ${
            seanceMessage.type === 'success'
              ? 'bg-green-100 border-green-500 text-green-700'
              : 'bg-red-100 border-red-500 text-red-700'
          }`}
        >
          {seanceMessage.text}
        </div>
      )}

      <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-4">Ajouter une séance</h3>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={newSeance.filiereId}
            onChange={(e) => {
              const filiereId = e.target.value;
              setNewSeance({ ...newSeance, filiereId, moduleId: '', groupeId: '' });
            }}
            className="input-field"
            required
          >
            <option value="">Filière</option>
            {filiere.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={newSeance.moduleId}
            onChange={(e) => setNewSeance({ ...newSeance, moduleId: e.target.value })}
            className="input-field"
            required
            disabled={!newSeance.filiereId}
          >
            <option value="">Module</option>
            {module
              .filter((m) => m.filiereId === newSeance.filiereId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>

          <select
            value={newSeance.groupeId}
            onChange={(e) => setNewSeance({ ...newSeance, groupeId: e.target.value })}
            className="input-field"
            required
            disabled={!newSeance.filiereId}
          >
            <option value="">Groupe</option>
            {groupe
              .filter((g) => g.filiereId === newSeance.filiereId)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
          </select>

          <select
            value={newSeance.profId}
            onChange={(e) => setNewSeance({ ...newSeance, profId: e.target.value })}
            className="input-field"
            disabled={!newSeance.moduleId || !newSeance.groupeId}
          >
            <option value="">Professeur (optionnel)</option>
            {professors
              .filter((p) => {
                if (!newSeance.moduleId || !newSeance.groupeId) return false;
                return p.professorAssignments?.some(
                  (a: any) => a.moduleId === newSeance.moduleId && a.groupeId === newSeance.groupeId
                );
              })
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
          </select>

          <input
            type="date"
            value={newSeance.date}
            onChange={(e) => setNewSeance({ ...newSeance, date: e.target.value })}
            className="input-field"
            required
          />

          <input
            type="time"
            placeholder="Heure début"
            value={newSeance.startTime}
            onChange={(e) => setNewSeance({ ...newSeance, startTime: e.target.value })}
            className="input-field"
            required
          />

          <input
            type="time"
            placeholder="Heure fin"
            value={newSeance.endTime}
            onChange={(e) => setNewSeance({ ...newSeance, endTime: e.target.value })}
            className="input-field"
            required
          />

          <button type="submit" className="btn-primary col-span-2">
            Ajouter
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Filière</th>
              <th className="border p-2 text-left">Module</th>
              <th className="border p-2 text-left">Groupe</th>
              <th className="border p-2 text-left">Professeur</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Heure début</th>
              <th className="border p-2 text-left">Heure fin</th>
              <th className="border p-2 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {seance.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="border p-2">{s.filiere?.name || s.groupe?.filiere?.name || 'N/A'}</td>
                <td className="border p-2">{s.module.name}</td>
                <td className="border p-2">{s.groupe.name}</td>
                <td className="border p-2">{s.professor ? `${s.professor.firstName} ${s.professor.lastName}` : 'Aucun'}</td>
                <td className="border p-2">{new Date(s.date).toLocaleDateString('fr-FR')}</td>
                <td className="border p-2">{s.startTime}</td>
                <td className="border p-2">{s.endTime}</td>
                <td className="border p-2">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Adminenrollment() {
  const [students, setStudents] = useState<any[]>([]);
  const [filiere, setfiliere] = useState<any[]>([]);
  const [groupe, setgroupe] = useState<any[]>([]);
  const [enrollment, setenrollment] = useState<any[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [importSelectedFiliereId, setImportSelectedFiliereId] = useState('');
  const [importSelectedGroupeId, setImportSelectedGroupeId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [newEnrollment, setNewEnrollment] = useState({ studentId: '', groupeId: '' });
  const [loading, setLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editStudentData, setEditStudentData] = useState({ email: '', firstName: '', lastName: '' });
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [userRes, filiereRes, groupeRes, enrollmentRes] = await Promise.all([
      fetch('/api/admin/user'),
      fetch('/api/admin/filiere'),
      fetch('/api/admin/groupe'),
      fetch('/api/admin/enrollment'),
    ]);

    const userData = await userRes.json();
    const filiereData = await filiereRes.json();
    const groupeData = await groupeRes.json();
    const enrollmentData = await enrollmentRes.json();

    setStudents(userData.filter((u: any) => u.role === 'STUDENT'));
    setfiliere(filiereData);
    setgroupe(groupeData);
    setenrollment(enrollmentData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollmentError(null);
    if (!newEnrollment.studentId || !newEnrollment.groupeId) return;

    const res = await fetch('/api/admin/enrollment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEnrollment),
    });

    if (res.ok) {
      setNewEnrollment({ studentId: '', groupeId: '' });
      loadAll();
    } else {
      const data = await res.json();
      setEnrollmentError(data.error || 'Erreur lors de l\'inscription');
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm('Supprimer cette inscription?')) return;
    const res = await fetch(`/api/admin/enrollment/${enrollmentId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      loadAll();
    }
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setEditStudentData({
      email: student.email || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const res = await fetch(`/api/admin/user/${editingStudent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editStudentData),
    });

    if (res.ok) {
      setEditingStudent(null);
      setEditStudentData({ email: '', firstName: '', lastName: '' });
      loadAll();
    }
  };

  const handleResetPassword = async (studentId: string) => {
    if (!confirm('Réinitialiser le mot de passe à Student@12345?')) return;

    const res = await fetch(`/api/admin/user/${studentId}/reset-password`, {
      method: 'POST',
    });

    if (res.ok) {
      alert('✅ Mot de passe réinitialisé à Student@12345. L\'étudiant devra le changer à la prochaine connexion.');
    } else {
      alert('❌ Erreur lors de la réinitialisation');
    }
  };

  const handleImportStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportMessage(null);

    if (!importFile || !importSelectedGroupeId) {
      setImportMessage('Veuillez sélectionner un fichier et un groupe.');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('groupeId', importSelectedGroupeId);

    const res = await fetch('/api/admin/user/import', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      const updated = typeof data.updated === 'number' ? `, ${data.updated} mis à jour` : '';
      setImportMessage(
        `Import terminé: ${data.created} créés, ${data.enrolled} inscrits${updated}, ${data.skipped} ignorés.`
      );
      setImportFile(null);
      loadAll();
    } else {
      setImportMessage(data.error || 'Erreur lors de l’import');
    }
    setImporting(false);
  };

  const filteredgroupe = selectedFiliere
    ? groupe.filter((g: any) => g.filiereId === selectedFiliere)
    : groupe;

  const importFilteredGroupe = importSelectedFiliereId
    ? groupe.filter((g: any) => g.filiereId === importSelectedFiliereId)
    : groupe;

  const getStudentFilieres = (studentId: string) => {
    const studentEnrollments = enrollment.filter((enr) => enr.studentId === studentId);
    const uniqueFilieres = new Set(
      studentEnrollments.map((enr) => JSON.stringify(enr.groupe.filiere))
    );
    return Array.from(uniqueFilieres).map((f) => JSON.parse(f));
  };

  const studentsWithMultipleFilieres = Array.from(
    new Set(enrollment.map((enr) => enr.studentId))
  ).filter((studentId) => getStudentFilieres(studentId).length > 1);

  const studentsWithMultipleGroups = Array.from(
    new Set(enrollment.map((enr) => enr.studentId))
  ).filter((studentId) => {
    const studentEnrollments = enrollment.filter((enr) => enr.studentId === studentId);
    return studentEnrollments.length > 1;
  });

  // Combine all problematic students into one set
  const problematicStudents = Array.from(
    new Set([...studentsWithMultipleFilieres, ...studentsWithMultipleGroups])
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={loadAll} className="btn-primary" disabled={loading}>
          {loading ? 'Chargement...' : 'Charger les inscriptions'}
        </button>
        {problematicStudents.length > 0 && (
          <div className="px-3 py-2 bg-red-100 text-red-800 rounded font-semibold">
            ⚠️ {problematicStudents.length} problème(s) d'inscription
          </div>
        )}
      </div>

  {problematicStudents.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded border border-red-200">
          <h3 className="font-bold mb-3 text-red-900">Problèmes d'inscription détectés</h3>
          <div className="space-y-2 text-sm">
            {problematicStudents.map((studentId) => {
              const student = enrollment.find((enr) => enr.studentId === studentId)?.student;
              const filieres = getStudentFilieres(studentId);
              const enrollmentsForStudent = enrollment.filter((enr) => enr.studentId === studentId);
                const hasMultipleFilieres = filieres.length > 1;
                const hasMultipleGroups = enrollmentsForStudent.length > 1;
                const problemsText = [];
                if (hasMultipleFilieres) problemsText.push(`plusieurs filières (${filieres.length})`);
                if (hasMultipleGroups) problemsText.push(`plusieurs groupes (${enrollmentsForStudent.length})`);
              return (
                <div key={studentId} className="p-2 bg-white rounded">
                  <div className="font-semibold text-red-700">
                    ❌ {student?.firstName} {student?.lastName} - Inscrit à {problemsText.join(' et ')}
                  </div>
                  <div className="ml-4 mt-1">
                    {filieres.map((fil) => (
                      <div key={fil.id} className="text-xs text-gray-600">
                        • <strong>{fil.name}</strong>:{' '}
                        {enrollmentsForStudent
                          .filter((enr) => enr.groupe.filiere.id === fil.id)
                          .map((enr) => enr.groupe.name)
                          .join(', ')}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {enrollmentsForStudent.map((enr) => (
                      <button
                        key={enr.id}
                        onClick={() => handleDeleteEnrollment(enr.id)}
                        className="btn-danger text-xs"
                      >
                        Supprimer {enr.groupe.filiere.name} / {enr.groupe.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleImportStudents} className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-4">Importer des étudiants (Excel)</h3>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={importSelectedFiliereId}
            onChange={(e) => {
              setImportSelectedFiliereId(e.target.value);
              setImportSelectedGroupeId('');
            }}
            className="input-field"
          >
            <option value="">Sélectionner une filière</option>
            {filiere.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select
            value={importSelectedGroupeId}
            onChange={(e) => setImportSelectedGroupeId(e.target.value)}
            className="input-field"
          >
            <option value="">Sélectionner un groupe</option>
            {importFilteredGroupe.map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="input-field"
          />
          <button type="submit" className="btn-primary" disabled={importing}>
            {importing ? 'Import...' : 'Importer'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Colonnes attendues: email, firstName, lastName (ou prenom, nom)
        </p>
        {importMessage && (
          <p className="mt-2 text-sm font-semibold">{importMessage}</p>
        )}
      </form>

      <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-4">Assigner un étudiant à un groupe</h3>
        <div className="grid grid-cols-3 gap-4">
          <select
            value={newEnrollment.studentId}
            onChange={(e) => setNewEnrollment({ ...newEnrollment, studentId: e.target.value })}
            className="input-field"
          >
            <option value="">Étudiant</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.email})
              </option>
            ))}
          </select>

          <select
            value={selectedFiliere}
            onChange={(e) => setSelectedFiliere(e.target.value)}
            className="input-field"
          >
            <option value="">Filière (pour filtrer)</option>
            {filiere.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={newEnrollment.groupeId}
            onChange={(e) => setNewEnrollment({ ...newEnrollment, groupeId: e.target.value })}
            className="input-field"
          >
            <option value="">Groupe</option>
            {filteredgroupe.map((g: any) => (
              <option key={g.id} value={g.id}>
                {g.name} ({filiere.find((f: any) => f.id === g.filiereId)?.name || '—'})
              </option>
            ))}
          </select>

          <button type="submit" className="btn-primary col-span-3">
            Assigner
          </button>
        </div>
        {enrollmentError && (
          <p className="mt-3 p-2 bg-red-100 text-red-800 text-sm rounded">{enrollmentError}</p>
        )}
      </form>

      <div className="overflow-x-auto">
        <h3 className="font-bold mb-4 text-lg">Inscriptions par filière et groupe</h3>
        {filiere.map((fil) => {
          const filiereGroupes = groupe.filter((g) => g.filiereId === fil.id);
          const filiereEnrollments = enrollment.filter((enr) =>
            filiereGroupes.some((g) => g.id === enr.groupeId)
          );

          if (filiereEnrollments.length === 0) return null;

          return (
            <div key={fil.id} className="mb-6 p-4 border rounded bg-gray-50">
              <h4 className="font-bold text-md mb-3">📚 {fil.name}</h4>
              {filiereGroupes.map((grp) => {
                const groupeEnrollments = enrollment.filter((enr) => enr.groupeId === grp.id);
                if (groupeEnrollments.length === 0) return null;

                return (
                  <div key={grp.id} className="mb-4 p-3 bg-white rounded border">
                    <h5 className="font-semibold mb-2">👥 {grp.name}</h5>
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Étudiant</th>
                          <th className="border p-2 text-left">Email</th>
                          <th className="border p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupeEnrollments.map((enr) => (
                          <tr key={enr.id} className="border-b">
                            <td className="border p-2">
                              {enr.student.firstName} {enr.student.lastName}
                            </td>
                            <td className="border p-2 text-xs">{enr.student.email}</td>
                            <td className="border p-2 text-xs">
                              <button
                                onClick={() => handleEditStudent(enr.student)}
                                className="btn-secondary text-xs mr-1"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteEnrollment(enr.id)}
                                className="btn-danger text-xs"
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Modifier l'étudiant</h3>
            <form onSubmit={handleUpdateStudent}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={editStudentData.email}
                  onChange={(e) =>
                    setEditStudentData({ ...editStudentData, email: e.target.value })
                  }
                  className="input-field w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Prénom</label>
                <input
                  type="text"
                  value={editStudentData.firstName}
                  onChange={(e) =>
                    setEditStudentData({ ...editStudentData, firstName: e.target.value })
                  }
                  className="input-field w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Nom</label>
                <input
                  type="text"
                  value={editStudentData.lastName}
                  onChange={(e) =>
                    setEditStudentData({ ...editStudentData, lastName: e.target.value })
                  }
                  className="input-field w-full"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => handleResetPassword(editingStudent.id)}
                  className="btn-secondary flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  🔒 Réinitialiser mot de passe
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudent(null);
                    setEditStudentData({ email: '', firstName: '', lastName: '' });
                  }}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
