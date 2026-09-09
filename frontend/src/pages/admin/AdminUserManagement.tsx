import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { adminApi } from '../../services/api/admin.api';
import { Users, Plus } from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('PROCUREMENT_OFFICER');

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createUser({ fullName, phoneNumber, email, role });
      setIsAddOpen(false);
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      await loadUsers();
    } catch (err) {
      console.error('Create user failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Users size={22} className="text-blue-900" />
              <span>User & Role Management</span>
            </h2>
            <Button size="sm" onClick={() => setIsAddOpen(true)} icon={<Plus size={16} />}>
              Create Staff User
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white font-bold text-sm">
              Registered System Users ({users.length})
            </div>

            <div className="divide-y divide-slate-200">
              {users.map(u => (
                <div key={u._id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-base">{u.fullName}</span>
                      <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">Phone: +91 {u.phoneNumber} • Email: {u.email || 'N/A'}</p>
                  </div>
                  <Badge status={u.status} />
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Staff Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Mobile Phone Number" type="tel" maxLength={10} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} required />
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Select
            label="Assigned System Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
              { value: 'CENTRE_MANAGER', label: 'Centre Manager' },
              { value: 'DISTRICT_OFFICER', label: 'District Officer' },
              { value: 'SUPER_ADMIN', label: 'Super Admin' }
            ]}
          />
          <Button fullWidth type="submit" variant="success">Create Staff Account</Button>
        </form>
      </Modal>
    </div>
  );
};
