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
          {['user', 'filiere', 'groupe', 'module', 'seance', 'enrollment'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="card">
          {activeTab === 'user' && <Adminuser />}
          {activeTab === 'filiere' && <Adminfiliere />}
          {activeTab === 'groupe' && <Admingroupe />}
          {activeTab === 'module' && <Adminmodule />}
          {activeTab === 'seance' && <Adminseance />}
          {activeTab === 'enrollment' && <Adminenrollment />}
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
  const [filieres, setFilieres] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [selectedFiliereId, setSelectedFiliereId] = useState('');
  const [selectedGroupeId, setSelectedGroupeId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
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

  const fetchFilieres = async () => {
    const res = await fetch('/api/admin/filiere');
    const data = await res.json();
    setFilieres(data);
  };

  const fetchGroupes = async () => {
    const res = await fetch('/api/admin/groupe');
    const data = await res.json();
    setGroupes(data);
  };

  useEffect(() => {
    fetchFilieres();
    fetchGroupes();
  }, []);

  const handleImportStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportMessage(null);

    if (!importFile || !selectedGroupeId) {
      setImportMessage('Veuillez sélectionner un fichier et un groupe.');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('groupeId', selectedGroupeId);

    const res = await fetch('/api/admin/user/import', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      setImportMessage(`Import terminé: ${data.created} créés, ${data.enrolled} inscrits, ${data.skipped} ignorés.`);
      setImportFile(null);
      fetchuser();
    } else {
      setImportMessage(data.error || 'Erreur lors de l’import');
    }
    setImporting(false);
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

      <form onSubmit={handleImportStudents} className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-4">Importer des étudiants (Excel)</h3>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={selectedFiliereId}
            onChange={(e) => {
              setSelectedFiliereId(e.target.value);
              setSelectedGroupeId('');
            }}
            className="input-field"
          >
            <option value="">Sélectionner une filière</option>
            {filieres.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select
            value={selectedGroupeId}
            onChange={(e) => setSelectedGroupeId(e.target.value)}
            className="input-field"
          >
            <option value="">Sélectionner un groupe</option>
            {groupes
              .filter((g) => !selectedFiliereId || g.filiereId === selectedFiliereId)
              .map((g) => (
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
  const [module, setmodule] = useState<any[]>([]);
  const [groupe, setgroupe] = useState<any[]>([]);
  const [newSeance, setNewSeance] = useState({
    moduleId: '',
    groupeId: '',
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
    const [moduleRes, groupeRes] = await Promise.all([
      fetch('/api/admin/module'),
      fetch('/api/admin/groupe'),
    ]);

    const moduleData = await moduleRes.json();
    const groupeData = await groupeRes.json();

    setmodule(moduleData);
    setgroupe(groupeData);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/seance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSeance),
    });
    setNewSeance({
      moduleId: '',
      groupeId: '',
      date: '',
      startTime: '',
      endTime: '',
    });
    fetchseance();
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

      <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-4">Ajouter une séance</h3>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={newSeance.moduleId}
            onChange={(e) => setNewSeance({ ...newSeance, moduleId: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Module</option>
            {module.map((m) => (
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
          >
            <option value="">Groupe</option>
            {groupe.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
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
              <th className="border p-2 text-left">Module</th>
              <th className="border p-2 text-left">Groupe</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Heure début</th>
              <th className="border p-2 text-left">Heure fin</th>
              <th className="border p-2 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {seance.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="border p-2">{s.module.name}</td>
                <td className="border p-2">{s.groupe.name}</td>
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
  const [newEnrollment, setNewEnrollment] = useState({ studentId: '', groupeId: '' });
  const [loading, setLoading] = useState(false);

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
    if (!newEnrollment.studentId || !newEnrollment.groupeId) return;

    const res = await fetch('/api/admin/enrollment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEnrollment),
    });

    if (res.ok) {
      setNewEnrollment({ studentId: '', groupeId: '' });
      loadAll();
    }
  };

  const filteredgroupe = selectedFiliere
    ? groupe.filter((g: any) => g.filiereId === selectedFiliere)
    : groupe;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={loadAll} className="btn-primary" disabled={loading}>
          {loading ? 'Chargement...' : 'Charger les inscriptions'}
        </button>
      </div>

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
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Étudiant</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Filière</th>
              <th className="border p-2 text-left">Groupe</th>
            </tr>
          </thead>
          <tbody>
            {enrollment.map((enr) => (
              <tr key={enr.id} className="border-b">
                <td className="border p-2">{enr.student.firstName} {enr.student.lastName}</td>
                <td className="border p-2">{enr.student.email}</td>
                <td className="border p-2">{enr.groupe.filiere.name}</td>
                <td className="border p-2">{enr.groupe.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
