import { useState, useEffect } from 'react';
import { FileDown, Calendar, Clock, Save, Loader2, Plus, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MealScheduleTable } from '@/components/MealScheduleTable.new';
import { useStore } from '@/store';
import { generatePDF } from '@/utils/pdfGenerator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

// Helper function to get current month in format: "january2025"
const getCurrentMonth = (): string => {
  const now = new Date();
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  return `${monthNames[now.getMonth()]}${now.getFullYear()}`;
};

// Format month for display (e.g., "december2025" -> "December 2025")
const formatMonthDisplay = (month: string): string => {
  const match = month.match(/^([a-z]+)(\d{4})$/i);
  if (match) {
    const monthName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const year = match[2];
    return `${monthName} ${year}`;
  }
  return month;
};

// Parse month string to get components
const parseMonth = (monthStr: string): { month: string; year: string } | null => {
  const match = monthStr.match(/^([a-z]+)(\d{4})$/i);
  if (match) {
    return { month: match[1], year: match[2] };
  }
  return null;
};

export function WeeklySchedule() {
  const { selectedCompanyId, companies, schedules, saveToStorage, mealSchedules, addMealSchedule } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [showAddMonth, setShowAddMonth] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState('');

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const schedule = selectedCompanyId ? schedules[selectedCompanyId] : undefined;

  // Load available months for the selected company
  useEffect(() => {
    if (selectedCompanyId && mealSchedules[selectedCompanyId]) {
      const months = mealSchedules[selectedCompanyId]
        .map(s => s.month)
        .sort((a, b) => {
          // Sort by year then month
          const aP = parseMonth(a);
          const bP = parseMonth(b);
          if (!aP || !bP) return 0;
          if (aP.year !== bP.year) return parseInt(bP.year) - parseInt(aP.year);
          
          const monthOrder = ['january', 'february', 'march', 'april', 'may', 'june',
                            'july', 'august', 'september', 'october', 'november', 'december'];
          return monthOrder.indexOf(bP.month.toLowerCase()) - monthOrder.indexOf(aP.month.toLowerCase());
        });
      
      setAvailableMonths(months);
      
      // Set current month as default if available, otherwise use first available
      const currentMonth = getCurrentMonth();
      if (months.includes(currentMonth)) {
        setSelectedMonth(currentMonth);
      } else if (months.length > 0) {
        setSelectedMonth(months[0]);
      } else {
        setSelectedMonth(currentMonth);
      }
    } else {
      setAvailableMonths([]);
      setSelectedMonth(getCurrentMonth());
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
      console.log('✅ Data saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewMonth = () => {
    if (!selectedCompanyId || !newMonthInput.trim()) return;
    
    // Parse the input and format it correctly
    const input = newMonthInput.trim().toLowerCase();
    let formattedMonth = input;
    
    // Handle different input formats
    const spaceMatch = input.match(/^([a-z]+)\s+(\d{4})$/);
    if (spaceMatch) {
      formattedMonth = `${spaceMatch[1]}${spaceMatch[2]}`;
    }
    
    // Add the new schedule
    addMealSchedule(selectedCompanyId, {
      companyId: selectedCompanyId,
      month: formattedMonth,
      entries: []
    });
    
    setSelectedMonth(formattedMonth);
    setNewMonthInput('');
    setShowAddMonth(false);
  };

  const handleQuickAddMonth = (monthsToAdd: number) => {
    if (!selectedCompanyId) return;
    
    const now = new Date();
    now.setMonth(now.getMonth() + monthsToAdd);
    
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const newMonth = `${monthNames[now.getMonth()]}${now.getFullYear()}`;
    
    // Check if month already exists
    if (!availableMonths.includes(newMonth)) {
      addMealSchedule(selectedCompanyId, {
        companyId: selectedCompanyId,
        month: newMonth,
        entries: []
      });
    }
    
    setSelectedMonth(newMonth);
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
    <div className="h-full flex flex-col bg-gradient-to-b from-bg-primary to-bg-surface">
      {/* Modern Header */}
      <div className="relative border-b border-border-light bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          {/* Top Row - Company Info and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-orange to-brand-amber flex items-center justify-center flex-shrink-0 shadow-md">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary truncate">{selectedCompany.name}</h1>
                <p className="text-sm text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  Monthly Meal Schedule
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 shadow-sm"
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
                className="flex-1 sm:flex-initial bg-brand-orange hover:bg-brand-orange/90 shadow-sm"
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Bottom Row - Month Selector and Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Month Selector */}
            <div className="flex-1 flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-text-secondary flex-shrink-0" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-1 bg-white border-2 border-border-light hover:border-brand-orange focus:border-brand-orange transition-colors">
                  <SelectValue placeholder="Select month">
                    {formatMonthDisplay(selectedMonth)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.length > 0 ? (
                    availableMonths.map(month => (
                      <SelectItem key={month} value={month}>
                        {formatMonthDisplay(month)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={getCurrentMonth()}>
                      {formatMonthDisplay(getCurrentMonth())}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAddMonth(1)}
                className="flex-1 sm:flex-initial"
              >
                <Plus className="w-4 h-4 mr-1" />
                Next Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddMonth(!showAddMonth)}
                className="flex-1 sm:flex-initial"
              >
                <Plus className="w-4 h-4 mr-1" />
                Custom Month
              </Button>
            </div>
          </div>

          {/* Add Month Form */}
          {showAddMonth && (
            <Card className="mt-3 p-4 bg-brand-orange/5 border-brand-orange/20">
              <div className="flex gap-2">
                <Input
                  value={newMonthInput}
                  onChange={(e) => setNewMonthInput(e.target.value)}
                  placeholder="e.g., january2025 or January 2025"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewMonth();
                    if (e.key === 'Escape') setShowAddMonth(false);
                  }}
                  className="flex-1"
                  autoFocus
                />
                <Button 
                  onClick={handleAddNewMonth}
                  disabled={!newMonthInput.trim()}
                  className="bg-brand-orange hover:bg-brand-orange/90"
                >
                  Add
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddMonth(false);
                    setNewMonthInput('');
                  }}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                💡 Tip: You can type in formats like "january2025", "January 2025", or "jan2025"
              </p>
            </Card>
          )}
        </div>

      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <MealScheduleTable companyId={selectedCompanyId!} month={selectedMonth} />
        </div>
      </div>
    </div>
  );
}
