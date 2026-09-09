import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface StageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  stageNumber: number;
  stageName: string;
  expectedQuantity?: number;
  isLoading?: boolean;
}

export const StageFormModal: React.FC<StageFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stageNumber,
  stageName,
  expectedQuantity = 1000,
  isLoading = false
}) => {
  const [actualWeight, setActualWeight] = useState<string>(expectedQuantity.toString());
  const [lorryNumber, setLorryNumber] = useState<string>('TS 08 AP 1234');
  const [numberOfBags, setNumberOfBags] = useState<string>('20');
  const [testResult, setTestResult] = useState<string>('PASS');
  const [remarks, setRemarks] = useState<string>('Verified and passed inspection');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { remarks };

    if (stageNumber === 1) payload.testResult = testResult;
    if (stageNumber === 2 || stageNumber === 4) payload.numberOfBags = parseFloat(numberOfBags);
    if (stageNumber === 5) payload.actualWeight = parseFloat(actualWeight);
    if (stageNumber === 6) payload.lorryNumber = lorryNumber;

    await onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Complete Stage ${stageNumber}: ${stageName}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {stageNumber === 1 && (
          <Select
            label="Maturity Quality Test Result"
            value={testResult}
            onChange={(e) => setTestResult(e.target.value)}
            options={[
              { value: 'PASS', label: 'PASS — Moisture Level & Quality Meets MSP Standard' },
              { value: 'FAIL', label: 'FAIL — Quality Rejected' }
            ]}
          />
        )}

        {(stageNumber === 2 || stageNumber === 4) && (
          <Input
            label="Number of Jute Bags Allocated/Stitched"
            type="number"
            value={numberOfBags}
            onChange={(e) => setNumberOfBags(e.target.value)}
            required
          />
        )}

        {stageNumber === 5 && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
            <p className="text-xs font-bold text-amber-900 uppercase">Weight Scale Measurement</p>
            <p className="text-xs text-slate-600">Expected Quantity booked by farmer: <strong>{expectedQuantity} KG</strong></p>
            <Input
              label="Actual Measured Weight (KG)"
              type="number"
              value={actualWeight}
              onChange={(e) => setActualWeight(e.target.value)}
              placeholder="e.g. 982"
              required
            />
          </div>
        )}

        {stageNumber === 6 && (
          <Input
            label="Lorry / Vehicle Transport License Number"
            type="text"
            value={lorryNumber}
            onChange={(e) => setLorryNumber(e.target.value)}
            placeholder="e.g. TS 08 AP 1234"
            required
          />
        )}

        <Input
          label="Officer Remarks"
          type="text"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add operational notes..."
        />

        <div className="flex items-center justify-end space-x-3 pt-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="success" type="submit" isLoading={isLoading}>
            Complete Stage {stageNumber}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
