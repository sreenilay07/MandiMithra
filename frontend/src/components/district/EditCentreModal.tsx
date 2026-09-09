import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { centreApi } from '../../services/api/centre.api';
import { X, Loader2 } from 'lucide-react';

interface EditCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  centreId: string | null;
}

export const EditCentreModal: React.FC<EditCentreModalProps> = ({ isOpen, onClose, onSuccess, centreId }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    defaultCapacity: 0,
    totalCounters: 0,
    activeCounters: 0,
    status: 'ACTIVE'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && centreId) {
      fetchCentreDetails();
    }
  }, [isOpen, centreId]);

  const fetchCentreDetails = async () => {
    setIsFetching(true);
    setError('');
    try {
      const res = await centreApi.getCentreById(centreId!);
      if (res.success && res.data?.centre) {
        const c = res.data.centre;
        setFormData({
          name: c.name || '',
          address: c.address || '',
          defaultCapacity: c.defaultCapacity || 0,
          totalCounters: c.totalCounters || 0,
          activeCounters: c.activeCounters || 0,
          status: c.status || 'ACTIVE'
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch centre details.');
    } finally {
      setIsFetching(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await centreApi.updateCentre(centreId!, {
        name: formData.name,
        address: formData.address,
        defaultCapacity: Number(formData.defaultCapacity),
        totalCounters: Number(formData.totalCounters),
        activeCounters: Number(formData.activeCounters),
        status: formData.status
      });
      
      if (res.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update procurement centre.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Edit Procurement Centre</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-800 text-sm font-semibold rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {isFetching ? (
            <div className="py-10 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin mb-2" size={24} />
              <p className="text-sm font-bold">Loading details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Centre Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Full Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Default Capacity (KG/day)"
                  name="defaultCapacity"
                  type="number"
                  value={formData.defaultCapacity.toString()}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Total Counters"
                  name="totalCounters"
                  type="number"
                  value={formData.totalCounters.toString()}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Active Counters"
                  name="activeCounters"
                  type="number"
                  value={formData.activeCounters.toString()}
                  onChange={handleChange}
                  required
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
