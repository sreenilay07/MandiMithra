import React, { useState, useEffect } from 'react';
import { Tag, Check, RefreshCw, X, AlertCircle } from 'lucide-react';
import { pricingApi } from '../../services/api/pricing.api';
import { centreApi } from '../../services/api/centre.api';
import type { CentrePricing } from '../../services/api/pricing.api';

const DEFAULT_CROPS = [
  { _id: 'paddy_default', name: 'Paddy' },
  { _id: 'wheat_default', name: 'Wheat' },
  { _id: 'maize_default', name: 'Maize' }
];

interface ProcurementPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  centreId: string;
  crops: Array<{ _id: string; name: string }>;
  onPriceUpdated?: () => void;
}

export const ProcurementPricingModal: React.FC<ProcurementPricingModalProps> = ({
  isOpen,
  onClose,
  centreId,
  crops,
  onPriceUpdated
}) => {
  const [activePrices, setActivePrices] = useState<CentrePricing[]>([]);
  const [availableCrops, setAvailableCrops] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('');
  const [unitInput, setUnitInput] = useState<string>('Per Quintal');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState<CentrePricing[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchPricingData = async () => {
    if (!centreId) return;
    try {
      setLoading(true);
      const res = await pricingApi.getByCentre(centreId);
      setActivePrices(res.data || []);
      const histRes = await pricingApi.getHistory(centreId);
      setHistory(histRes.data || []);
    } catch (err: any) {
      console.error('Failed to load prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCrops = async () => {
      let list = crops && crops.length > 0 ? crops : [];
      if (list.length === 0) {
        try {
          const res = await centreApi.getCrops();
          if (res.data && res.data.length > 0) {
            list = res.data;
          }
        } catch (e) {
          console.error('Failed to load crops in modal', e);
        }
      }
      if (list.length === 0) {
        list = DEFAULT_CROPS;
      }
      setAvailableCrops(list);
      if (list.length > 0) {
        setSelectedCropId(list[0]._id);
      }
    };

    if (isOpen) {
      fetchPricingData();
      loadCrops();
    }
  }, [isOpen, centreId, crops]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCropId) {
      setError('Please select a crop');
      return;
    }
    if (!priceInput || isNaN(Number(priceInput)) || Number(priceInput) <= 0) {
      setError('Please enter a valid procurement price');
      return;
    }

    try {
      setLoading(true);
      const crop = availableCrops.find(c => c._id === selectedCropId);
      await pricingApi.createOrUpdatePrice({
        centreId,
        cropId: selectedCropId,
        cropName: crop ? crop.name : 'Crop',
        price: Number(priceInput),
        unit: unitInput,
        effectiveFrom
      });

      setSuccess(`✓ Procurement price updated for ${crop ? crop.name : 'Crop'} to ₹${Number(priceInput).toLocaleString('en-IN')}/${unitInput}`);
      setPriceInput('');
      fetchPricingData();
      if (onPriceUpdated) onPriceUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update procurement price.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-600">
          <div className="flex items-center space-x-2">
            <Tag className="text-amber-400" size={22} />
            <div>
              <h2 className="text-lg font-bold">Configure Procurement Pricing</h2>
              <p className="text-xs text-blue-200">Centre Manager Pricing Control • MandiMithra</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
              <Check size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Current Active Prices Table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center justify-between">
              <span>Current Active Procurement Prices</span>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-blue-700 hover:underline font-medium"
              >
                {showHistory ? 'Hide History' : 'View Price History'}
              </button>
            </h3>

            {activePrices.length === 0 ? (
              <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border">No custom prices configured yet. Default MSP rates will apply.</p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2">Crop</th>
                      <th className="px-4 py-2">Current Price</th>
                      <th className="px-4 py-2">Unit</th>
                      <th className="px-4 py-2">Effective Date</th>
                      <th className="px-4 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activePrices.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{p.cropName}</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">₹{p.price.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-slate-600">{p.unit}</td>
                        <td className="px-4 py-3 text-slate-600">{new Date(p.effectiveFrom).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form to Update Price */}
          <form onSubmit={handleSubmit} className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-4">
            <h3 className="text-sm font-bold text-blue-950">Update / Set New Procurement Price</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Crop</label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 cursor-pointer"
                >
                  {availableCrops.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Procurement Price (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 2300"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                <select
                  value={unitInput}
                  onChange={(e) => setUnitInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Per Quintal">Per Quintal (100 KG)</option>
                  <option value="Per KG">Per KG</option>
                  <option value="Per Ton">Per Ton</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Effective From</label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Check size={18} />}
              <span>Publish & Update Price Realtime</span>
            </button>
          </form>

          {/* History View */}
          {showHistory && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Pricing Audit History</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
                {history.map((h) => (
                  <div key={h._id} className="p-2 bg-white rounded border flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-900">{h.cropName}</span> — ₹{h.price} / {h.unit}
                      <span className="text-slate-400 block text-[10px]">
                        Effective: {new Date(h.effectiveFrom).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
