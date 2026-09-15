import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { centreApi } from '../../services/api/centre.api';
import { bookingApi } from '../../services/api/booking.api';
import { pricingApi } from '../../services/api/pricing.api';
import type { CentrePricing } from '../../services/api/pricing.api';
import { t } from '../../services/i18n';
import { CalendarPlus, CheckCircle2, Sprout, Scale, Tag } from 'lucide-react';

const DEFAULT_CROPS = [
  { _id: 'paddy_default', name: 'Paddy', code: 'PADDY', unit: 'KG' },
  { _id: 'wheat_default', name: 'Wheat', code: 'WHEAT', unit: 'KG' },
  { _id: 'maize_default', name: 'Maize', code: 'MAIZE', unit: 'KG' }
];

export const BookSlotPage: React.FC = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState<any[]>(DEFAULT_CROPS);
  const [centres, setCentres] = useState<any[]>([]);

  const [selectedCropId, setSelectedCropId] = useState('paddy_default');
  const [expectedQuantity, setExpectedQuantity] = useState('1000');
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().slice(0, 10));

  const [livePrices, setLivePrices] = useState<CentrePricing[]>([]);
  const [currentPriceInfo, setCurrentPriceInfo] = useState<{ price: number; unit: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [cropRes, centreRes] = await Promise.allSettled([
          centreApi.getCrops(),
          centreApi.getCentres()
        ]);
        
        let loadedCrops: any[] = DEFAULT_CROPS;
        if (cropRes.status === 'fulfilled' && cropRes.value?.data?.length > 0) {
          loadedCrops = cropRes.value.data;
        }
        setCrops(loadedCrops);
        if (loadedCrops.length > 0) setSelectedCropId(loadedCrops[0]._id);

        let loadedCentres: any[] = [];
        if (centreRes.status === 'fulfilled' && centreRes.value?.data?.length > 0) {
          loadedCentres = centreRes.value.data;
        }
        setCentres(loadedCentres);
        if (loadedCentres.length > 0) setSelectedCentreId(loadedCentres[0]._id);
      } catch (err) {
        console.error('Failed to load crops or centres', err);
      }
    };
    loadInitialData();
  }, []);

  // Fetch live prices whenever selected centre or crop changes
  useEffect(() => {
    if (!selectedCentreId) return;
    pricingApi.getByCentre(selectedCentreId)
      .then((res) => {
        setLivePrices(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch centre pricing', err);
      });
  }, [selectedCentreId]);

  useEffect(() => {
    if (selectedCropId && livePrices.length > 0) {
      const match = livePrices.find(p => p.cropId === selectedCropId || p.cropName.toLowerCase() === crops.find(c => c._id === selectedCropId)?.name.toLowerCase());
      if (match) {
        setCurrentPriceInfo({ price: match.price, unit: match.unit });
      } else {
        setCurrentPriceInfo({ price: 2300, unit: 'Per Quintal' });
      }
    } else {
      setCurrentPriceInfo({ price: 2300, unit: 'Per Quintal' });
    }
  }, [selectedCropId, livePrices, crops]);

  const qty = parseFloat(expectedQuantity) || 0;
  const quantityInQuintal = (qty / 100);
  const priceVal = currentPriceInfo ? currentPriceInfo.price : 2300;
  const estimatedGrossValue = Math.round(quantityInQuintal * priceVal);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCropId || !selectedCentreId || !expectedQuantity) {
      setError('Please fill in all booking fields.');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid produce quantity in KG.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await bookingApi.createBooking({
        centreId: selectedCentreId,
        cropId: selectedCropId,
        expectedQuantity: qty,
        preferredDate
      });

      navigate('/farmer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reserve procurement slot.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      <AppHeader />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <Card className="border-t-4 border-t-emerald-700 shadow-md">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4 text-slate-900 font-extrabold text-lg">
            <CalendarPlus size={22} className="text-emerald-700" />
            <span>{t('book_slot')}</span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-semibold rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="space-y-5">
            {/* Step 1: Crop Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Sprout size={16} className="text-emerald-700" />
                <span>1. {t('select_crop')}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {crops.map((crop) => {
                  const isSelected = selectedCropId === crop._id;
                  return (
                    <button
                      type="button"
                      key={crop._id}
                      onClick={() => setSelectedCropId(crop._id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800 font-medium'
                      }`}
                    >
                      <p className="text-sm font-extrabold">{crop.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{crop.unit || 'KG'}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Expected Quantity */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Scale size={16} className="text-amber-700" />
                <span>2. {t('expected_quantity')}</span>
              </label>
              <Input
                type="number"
                inputMode="numeric"
                value={expectedQuantity}
                onChange={(e) => setExpectedQuantity(e.target.value)}
                placeholder="1000"
                className="text-2xl font-black text-center text-slate-900"
                required
              />
              <p className="text-xs text-slate-500 text-center font-medium">
                Enter total produce weight in Kilograms (KG)
              </p>
            </div>

            {/* Live Pricing & Value Banner */}
            <div className="bg-emerald-950 text-white p-4 rounded-xl border-2 border-emerald-600 shadow-md space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                <span className="flex items-center space-x-1">
                  <Tag size={14} className="text-amber-400" />
                  <span>CURRENT PROCUREMENT PRICE</span>
                </span>
                <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded text-[10px]">
                  LIVE BACKEND RATE
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <span className="text-sm font-bold text-slate-200">
                    {crops.find(c => c._id === selectedCropId)?.name || 'Paddy'}
                  </span>
                  <p className="text-xl font-extrabold text-amber-400">
                    ₹{priceVal.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-300">/ {currentPriceInfo?.unit || 'Quintal'}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-300 block">Estimated Gross Value</span>
                  <span className="text-lg font-black text-emerald-400">
                    ₹{estimatedGrossValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Select Procurement Centre */}
            <Select
              label={`3. ${t('select_centre')}`}
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              options={centres.map(c => ({
                value: c._id,
                label: `${c.name} (${c.village})`
              }))}
            />

            {/* Step 4: Preferred Date */}
            <Input
              label={`4. ${t('select_date')}`}
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              required
            />

            {/* Step 5: Confirm Button */}
            <Button
              fullWidth
              type="submit"
              variant="success"
              isLoading={isLoading}
              icon={<CheckCircle2 size={18} />}
            >
              {t('confirm_booking')}
            </Button>
          </form>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
};
