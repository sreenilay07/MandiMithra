import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { FileCheck, CheckSquare, Square } from 'lucide-react';
import { t } from '../../services/i18n';

interface RequiredDoc {
  name: string;
  required?: boolean;
}

interface DocumentChecklistProps {
  documents?: RequiredDoc[];
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  documents = [
    { name: 'Aadhaar Card (Original)', required: true },
    { name: 'Bank Passbook (Active Account & IFSC)', required: true },
    { name: 'Pattadar Land Passbook / Land Reference', required: true }
  ]
}) => {
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedState(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <Card className="border-amber-600/30 bg-amber-50/30">
      <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base mb-2 border-b border-amber-200/80 pb-2">
        <FileCheck size={20} className="text-amber-700" />
        <span>{t('document_reminder')}</span>
      </div>

      <p className="text-xs text-slate-700 font-medium mb-3">
        {t('bring_docs')}
      </p>

      <div className="space-y-2.5">
        {documents.map((doc, idx) => {
          const isChecked = !!checkedState[idx];
          return (
            <div
              key={idx}
              onClick={() => toggleCheck(idx)}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer tap-target select-none ${
                isChecked
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-800 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                {isChecked ? (
                  <CheckSquare size={22} className="text-emerald-700 shrink-0" />
                ) : (
                  <Square size={22} className="text-slate-400 shrink-0" />
                )}
                <span className="text-sm">{doc.name}</span>
              </div>

              {isChecked && (
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  READY ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
