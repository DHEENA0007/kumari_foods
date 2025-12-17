import { useState, useEffect } from 'react';
import { FileDown, Calendar, Clock, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountDetailsPanel } from '@/components/AccountDetailsPanel';
import { MealScheduleTable } from '@/components/MealScheduleTable';
import { useStore } from '@/store';
import { generatePDF } from '@/utils/pdfGenerator';

// Helper function to get current month in format: "january2025"
const getCurrentMonth = (): string => {
  const now = new Date();
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  return `${monthNames[now.getMonth()]}${now.getFullYear()}`;
};

export function WeeklySchedule() {
  const { selectedCompanyId, companies, schedules, saveToStorage, mealSchedules } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth());

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const schedule = selectedCompanyId ? schedules[selectedCompanyId] : undefined;

  // Automatically detect available month for the selected company
  useEffect(() => {
    if (selectedCompanyId && mealSchedules[selectedCompanyId]) {
      const availableSchedules = mealSchedules[selectedCompanyId];
      if (availableSchedules && availableSchedules.length > 0) {
        // Use the first available schedule or current month if it exists
        const currentMonthSchedule = availableSchedules.find(s => s.month === getCurrentMonth());
        if (currentMonthSchedule) {
          setCurrentMonth(currentMonthSchedule.month);
        } else {
          // Use the most recent schedule
          setCurrentMonth(availableSchedules[availableSchedules.length - 1].month);
        }
      } else {
        // Default to current month
        setCurrentMonth(getCurrentMonth());
      }
    } else {
      setCurrentMonth(getCurrentMonth());
    }
  }, [selectedCompanyId, mealSchedules]);

  const handleDownloadPDF = async () => {
    if (selectedCompany) {
      await generatePDF(selectedCompany.name, schedule);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveToStorage();
      // Optional: Show success message
      console.log('✅ Data saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save data:', error);
      // Optional: Show error message
    } finally {
      setIsSaving(false);
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
                  Monthly Schedule
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 shadow-sm text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button 
              onClick={handleDownloadPDF} 
              className="flex-1 sm:flex-initial bg-brand-orange hover:bg-brand-orange/90 shadow-sm text-sm"
            >
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Account Details Panel */}
        <AccountDetailsPanel accountDetails={selectedCompany.accountDetails} />
        
        {/* Table Content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-6">
          <MealScheduleTable companyId={selectedCompanyId!} month={currentMonth} />
        </div>
      </div>
    </div>
  );
}
