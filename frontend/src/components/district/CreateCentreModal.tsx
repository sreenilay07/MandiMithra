import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { centreApi } from '../../services/api/centre.api';
import { X } from 'lucide-react';

interface CreateCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCentreModal: React.FC<CreateCentreModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    village: '',
    contactNumber: '',
    defaultCapacity: 2000,
    totalCounters: 2,
    latitude: 17.385, // Default somewhere in TS/AP
    longitude: 78.486
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await centreApi.createCentre({
        ...formData,
        defaultCapacity: Number(formData.defaultCapacity),
        totalCounters: Number(formData.totalCounters),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude)
      });
      
      if (res.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create procurement centre.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Add New Procurement Centre</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-800 text-sm font-semibold rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Centre Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Nizamabad AMC"
                required
              />
              <Input
                label="Centre Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., AMC-NZB-01"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Village / Area"
                name="village"
                value={formData.village}
                onChange={handleChange}
                required
              />
              <Input
                label="Contact Number"
                name="contactNumber"
                type="tel"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </div>

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

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading} className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold">
                Create Centre
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
