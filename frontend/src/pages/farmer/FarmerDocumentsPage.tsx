import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { DocumentChecklist } from '../../components/farmer/DocumentChecklist';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, FileText, Info } from 'lucide-react';
import { t } from '../../services/i18n';

export const FarmerDocumentsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      <AppHeader />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText size={22} className="text-emerald-700" />
            <span>{t('document_reminder')}</span>
          </h2>
          <Button size="sm" variant="ghost" onClick={() => navigate('/farmer/dashboard')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start space-x-3">
          <Info size={20} className="text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-950 font-medium space-y-1">
            <p className="font-bold">Required for On-site Verification & Fast Settlement</p>
            <p>
              Please carry physical originals or verified digital copies of all 3 mandatory documents to the Procurement Centre on your allocated slot day.
            </p>
          </div>
        </div>

        <DocumentChecklist />
      </main>

      <BottomNavigation />
    </div>
  );
};
