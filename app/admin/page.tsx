'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');

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
          {['users', 'filieres', 'groupes', 'modules', 'seances', 'enrollments'].map((tab) => (
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
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'filieres' && <AdminFilieres />}
          {activeTab === 'groupes' && <AdminGroupes />}
          {activeTab === 'modules' && <AdminModules />}
          {activeTab === 'seances' && <AdminSeances />}
          {activeTab === 'enrollments' && <AdminEnrollments />}
        </div>
      </main>
    </>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'STUDENT',
  });

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    setNewUser({ email: '', firstName: '', lastName: '', password: '', role: 'STUDENT' });
    fetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Confirmer la suppression?')) {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    }
  };

  return (
    <div>
      <button
        onClick={fetchUsers}
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
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.firstName} {user.lastName}</td>
                <td className="border p-2">{user.role}</td>
                <td className="border p-2">
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
    </div>
  );
}

function AdminFilieres() {
  const [filieres, setFilieres] = useState<any[]>([]);
  const [newName, setNewName] = useState('');

  const fetchFilieres = async () => {
    const res = await fetch('/api/admin/filieres');
    const data = await res.json();
    setFilieres(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/filieres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    setNewName('');
    fetchFilieres();
  };

  return (
    <div>
      <button onClick={fetchFilieres} className="btn-primary mb-4">
        Charger les filières
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
        {filieres.map((f) => (
          <li key={f.id} className="p-2 border-b">
            {f.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminGroupes() {
  const [groupes, setGroupes] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [newGroupe, setNewGroupe] = useState({ name: '', filiereId: '' });

  const fetchGroupes = async () => {
    const res = await fetch('/api/admin/groupes');
    const data = await res.json();
    setGroupes(data);
  };

  const fetchFilieres = async () => {
    const res = await fetch('/api/admin/filieres');
    const data = await res.json();
    setFilieres(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/groupes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroupe),
    });
    setNewGroupe({ name: '', filiereId: '' });
    fetchGroupes();
  };

  return (
    <div>
      <button
        onClick={() => {
          fetchGroupes();
          fetchFilieres();
        }}
        className="btn-primary mb-4"
      >
        Charger les groupes
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
          {filieres.map((f) => (
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
        {groupes.map((g) => (
          <li key={g.id} className="p-2 border-b">
            {g.name} ({g.filiere.name})
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminModules() {
  const [modules, setModules] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [newModule, setNewModule] = useState({ name: '', filiereId: '' });

  const fetchModules = async () => {
    const res = await fetch('/api/admin/modules');
    const data = await res.json();
    setModules(data);
  };

  const fetchFilieres = async () => {
    const res = await fetch('/api/admin/filieres');
    const data = await res.json();
    setFilieres(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newModule),
    });
    setNewModule({ name: '', filiereId: '' });
    fetchModules();
  };

  return (
    <div>
      <button
        onClick={() => {
          fetchModules();
          fetchFilieres();
        }}
        className="btn-primary mb-4"
      >
        Charger les modules
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
          {filieres.map((f) => (
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
        {modules.map((m) => (
          <li key={m.id} className="p-2 border-b">
            {m.name} ({m.filiere.name})
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminSeances() {
  const [seances, setSeances] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [newSeance, setNewSeance] = useState({
    moduleId: '',
    professorId: '',
    groupeId: '',
    startsAt: '',
    endsAt: '',
    room: '',
  });

  const fetchSeances = async () => {
    const res = await fetch('/api/admin/seances');
    const data = await res.json();
    setSeances(data);
  };

  const loadLists = async () => {
    const [modulesRes, usersRes, groupesRes] = await Promise.all([
      fetch('/api/admin/modules'),
      fetch('/api/admin/users'),
      fetch('/api/admin/groupes'),
    ]);

    const modulesData = await modulesRes.json();
    const usersData = await usersRes.json();
    const groupesData = await groupesRes.json();

    setModules(modulesData);
    setProfs(usersData.filter((u: any) => u.role === 'PROF'));
    setGroupes(groupesData);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/seances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSeance),
    });
    setNewSeance({
      moduleId: '',
      professorId: '',
      groupeId: '',
      startsAt: '',
      endsAt: '',
      room: '',
    });
    fetchSeances();
  };

  return (
    <div>
      <button
        onClick={() => {
          fetchSeances();
          loadLists();
        }}
        className="btn-primary mb-4"
      >
        Charger les séances
      </button>

      <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-4">Ajouter une séance</h3>
        <div className="grid grid-cols-3 gap-4">
          <select
            value={newSeance.moduleId}
            onChange={(e) => setNewSeance({ ...newSeance, moduleId: e.target.value })}
            className="input-field"
          >
            <option value="">Module</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={newSeance.professorId}
            onChange={(e) => setNewSeance({ ...newSeance, professorId: e.target.value })}
            className="input-field"
          >
            <option value="">Professeur</option>
            {profs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>

          <select
            value={newSeance.groupeId}
            onChange={(e) => setNewSeance({ ...newSeance, groupeId: e.target.value })}
            className="input-field"
          >
            <option value="">Groupe</option>
            {groupes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={newSeance.startsAt}
            onChange={(e) => setNewSeance({ ...newSeance, startsAt: e.target.value })}
            className="input-field"
          />

          <input
            type="datetime-local"
            value={newSeance.endsAt}
            onChange={(e) => setNewSeance({ ...newSeance, endsAt: e.target.value })}
            className="input-field"
          />

          <input
            type="text"
            placeholder="Salle"
            value={newSeance.room}
            onChange={(e) => setNewSeance({ ...newSeance, room: e.target.value })}
            className="input-field"
          />
          <button type="submit" className="btn-primary col-span-3">
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
              <th className="border p-2 text-left">Professeur</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Salle</th>
              <th className="border p-2 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {seances.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="border p-2">{s.module.name}</td>
                <td className="border p-2">{s.groupe.name}</td>
                <td className="border p-2">{s.professor.firstName} {s.professor.lastName}</td>
                <td className="border p-2">{new Date(s.startsAt).toLocaleString('fr-FR')}</td>
                <td className="border p-2">{s.room}</td>
                <td className="border p-2">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminEnrollments() {
  const [students, setStudents] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [newEnrollment, setNewEnrollment] = useState({ studentId: '', groupeId: '' });
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [usersRes, filieresRes, groupesRes, enrollmentsRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/filieres'),
      fetch('/api/admin/groupes'),
      fetch('/api/admin/enrollments'),
    ]);

    const usersData = await usersRes.json();
    const filieresData = await filieresRes.json();
    const groupesData = await groupesRes.json();
    const enrollmentsData = await enrollmentsRes.json();

    setStudents(usersData.filter((u: any) => u.role === 'STUDENT'));
    setFilieres(filieresData);
    setGroupes(groupesData);
    setEnrollments(enrollmentsData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnrollment.studentId || !newEnrollment.groupeId) return;

    const res = await fetch('/api/admin/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEnrollment),
    });

    if (res.ok) {
      setNewEnrollment({ studentId: '', groupeId: '' });
      loadAll();
    }
  };

  const filteredGroupes = selectedFiliere
    ? groupes.filter((g: any) => g.filiereId === selectedFiliere)
    : groupes;

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
            {filieres.map((f) => (
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
            {filteredGroupes.map((g: any) => (
              <option key={g.id} value={g.id}>
                {g.name} ({filieres.find((f: any) => f.id === g.filiereId)?.name || '—'})
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
            {enrollments.map((enr) => (
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
