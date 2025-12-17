import { useState } from 'react';
import { FileDown, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountDetailsPanel } from '@/components/AccountDetailsPanel';
import { MealScheduleTable } from '@/components/MealScheduleTable';
import { WeeklyMealSchedule } from '@/components/WeeklyMealSchedule';
import { useStore } from '@/store';
import { generatePDF } from '@/utils/pdfGenerator';

export function WeeklySchedule() {
  const { selectedCompanyId, companies, schedules } = useStore();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const schedule = selectedCompanyId ? schedules[selectedCompanyId] : undefined;

  const handleDownloadPDF = async () => {
    if (selectedCompany) {
      await generatePDF(selectedCompany.name, schedule);
    }
  };

  if (!selectedCompany) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium mb-2">No company selected</p>
            <p className="text-sm text-muted-foreground">Select a company from the sidebar to view its schedule</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with gradient */}
      <div className="relative p-3 sm:p-6 border-b border-border-light bg-gradient-to-br from-brand-orange/10 via-brand-amber/5 to-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-orange/10 border-2 border-brand-orange/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-text-primary truncate">{selectedCompany.name}</h1>
                <p className="text-xs sm:text-sm text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  {activeTab === 'weekly' ? 'Weekly Schedule' : 'Monthly Schedule'}
                </p>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <Button 
              onClick={handleDownloadPDF} 
              className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange/90 shadow-sm text-sm"
            >
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border-light bg-bg-surface">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
            activeTab === 'weekly'
              ? 'text-brand-orange border-b-2 border-brand-orange'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Weekly View
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
            activeTab === 'monthly'
              ? 'text-brand-orange border-b-2 border-brand-orange'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Monthly View
        </button>
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Account Details Panel */}
        <AccountDetailsPanel accountDetails={selectedCompany.accountDetails} />
        
        {/* Table Content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-6">
          {activeTab === 'weekly' ? (
            <WeeklyMealSchedule companyId={selectedCompanyId!} />
          ) : (
            <MealScheduleTable companyId={selectedCompanyId!} month="May 2025" />
          )}
        </div>
      </div>
    </div>
  );
}
