import { useState, useEffect } from 'react';
import { 
  FileDown, 
  Calendar, 
  Save, 
  Loader2, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  ListFilter,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MealScheduleTable } from '@/components/MealScheduleTable';
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

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 
                     'july', 'august', 'september', 'october', 'november', 'december'];

// Get current month in format: "january2025"
const getCurrentMonth = (): string => {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]}${now.getFullYear()}`;
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

// Parse month string
const parseMonth = (monthStr: string): { monthIndex: number; year: number } | null => {
  const match = monthStr.match(/^([a-z]+)(\d{4})$/i);
  if (match) {
    const monthIndex = MONTH_NAMES.indexOf(match[1].toLowerCase());
    const year = parseInt(match[2]);
    if (monthIndex !== -1) {
      return { monthIndex, year };
    }
  }
  return null;
};

// Navigate to next/previous month
const navigateMonth = (currentMonth: string, direction: 'next' | 'prev'): string => {
  const parsed = parseMonth(currentMonth);
  if (!parsed) return currentMonth;
  
  let { monthIndex, year } = parsed;
  
  if (direction === 'next') {
    monthIndex++;
    if (monthIndex > 11) {
      monthIndex = 0;
      year++;
    }
  } else {
    monthIndex--;
    if (monthIndex < 0) {
      monthIndex = 11;
      year--;
    }
  }
  
  return `${MONTH_NAMES[monthIndex]}${year}`;
};

export function WeeklySchedule() {
  const { 
    selectedCompanyId, 
    companies, 
    schedules, 
    saveToStorage, 
    mealSchedules, 
    addMealSchedule 
  } = useStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [showAddCustomMonth, setShowAddCustomMonth] = useState(false);
  const [customMonthName, setCustomMonthName] = useState('');
  const [customYear, setCustomYear] = useState(new Date().getFullYear().toString());
  const [filterMode, setFilterMode] = useState<'all' | 'existing'>('all');

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const schedule = selectedCompanyId ? schedules[selectedCompanyId] : undefined;
  
  // Get available months for the selected company
  const availableMonths = selectedCompanyId && mealSchedules[selectedCompanyId]
    ? mealSchedules[selectedCompanyId].map(s => s.month).sort((a, b) => {
        const aP = parseMonth(a);
        const bP = parseMonth(b);
        if (!aP || !bP) return 0;
        if (aP.year !== bP.year) return bP.year - aP.year;
        return bP.monthIndex - aP.monthIndex;
      })
    : [];

  // Check if selected month has data
  const hasDataForMonth = availableMonths.includes(selectedMonth);

  // Initialize selected month
  useEffect(() => {
    if (selectedCompanyId) {
      const currentMonth = getCurrentMonth();
      if (availableMonths.includes(currentMonth)) {
        setSelectedMonth(currentMonth);
      } else if (availableMonths.length > 0) {
        setSelectedMonth(availableMonths[0]);
      } else {
        setSelectedMonth(currentMonth);
      }
    }
  }, [selectedCompanyId]);

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

  const handleAddCustomMonth = () => {
    if (!selectedCompanyId || !customMonthName.trim() || !customYear.trim()) return;
    
    const formattedMonth = `${customMonthName.toLowerCase()}${customYear}`;
    
    // Check if month already exists
    if (!availableMonths.includes(formattedMonth)) {
      addMealSchedule(selectedCompanyId, {
        companyId: selectedCompanyId,
        month: formattedMonth,
        entries: []
      });
    }
    
    setSelectedMonth(formattedMonth);
    setCustomMonthName('');
    setCustomYear(new Date().getFullYear().toString());
    setShowAddCustomMonth(false);
  };

  const handleQuickAddMonth = (offsetMonths: number) => {
    if (!selectedCompanyId) return;
    
    const now = new Date();
    now.setMonth(now.getMonth() + offsetMonths);
    
    const newMonth = `${MONTH_NAMES[now.getMonth()]}${now.getFullYear()}`;
    
    // Create if doesn't exist
    if (!availableMonths.includes(newMonth)) {
      addMealSchedule(selectedCompanyId, {
        companyId: selectedCompanyId,
        month: newMonth,
        entries: []
      });
    }
    
    setSelectedMonth(newMonth);
  };

  const handleNavigateMonth = (direction: 'next' | 'prev') => {
    const newMonth = navigateMonth(selectedMonth, direction);
    
    // If in 'existing' filter mode, only navigate to existing months
    if (filterMode === 'existing') {
      const currentIndex = availableMonths.indexOf(selectedMonth);
      if (direction === 'next' && currentIndex > 0) {
        setSelectedMonth(availableMonths[currentIndex - 1]);
      } else if (direction === 'prev' && currentIndex < availableMonths.length - 1) {
        setSelectedMonth(availableMonths[currentIndex + 1]);
      }
    } else {
      // Create the month if it doesn't exist
      if (selectedCompanyId && !availableMonths.includes(newMonth)) {
        addMealSchedule(selectedCompanyId, {
          companyId: selectedCompanyId,
          month: newMonth,
          entries: []
        });
      }
      setSelectedMonth(newMonth);
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
      {/* Header */}
      <div className="relative p-4 sm:p-6 border-b border-border-light bg-gradient-to-br from-brand-orange/10 via-brand-amber/5 to-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border-2 border-brand-orange/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-brand-orange" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-text-primary truncate">{selectedCompany.name}</h1>
                <p className="text-sm text-text-secondary">Monthly Meal Schedule</p>
              </div>
            </div>
          </div>
          
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
      </div>

      {/* Month Selector & Controls */}
      <div className="p-4 sm:p-6 border-b border-border-light bg-bg-surface space-y-4">
        {/* Main Month Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigateMonth('prev')}
            className="flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="flex-1 h-12 text-lg font-semibold">
                <SelectValue>
                  {formatMonthDisplay(selectedMonth)}
                  {!hasDataForMonth && filterMode === 'existing' && ' (No Data)'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(filterMode === 'existing' ? availableMonths : [selectedMonth, ...availableMonths.filter(m => m !== selectedMonth)]).map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatMonthDisplay(month)}
                    {availableMonths.includes(month) && (
                      <span className="ml-2 text-green-600">●</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Toggle */}
            <Button
              variant={filterMode === 'existing' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setFilterMode(filterMode === 'all' ? 'existing' : 'all')}
              title={filterMode === 'existing' ? 'Show all months' : 'Show only existing months'}
              className="flex-shrink-0"
            >
              <ListFilter className="w-5 h-5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigateMonth('next')}
            className="flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAddMonth(0)}
            className="text-sm"
          >
            Current Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAddMonth(1)}
            className="text-sm"
          >
            Next Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCustomMonth(!showAddCustomMonth)}
            className="text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Custom Month
          </Button>
          
          {availableMonths.length > 0 && (
            <div className="ml-auto text-sm text-text-secondary flex items-center gap-1">
              <span className="text-green-600">●</span>
              {availableMonths.length} month{availableMonths.length !== 1 ? 's' : ''} with data
            </div>
          )}
        </div>

        {/* Add Custom Month Form */}
        {showAddCustomMonth && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-text-primary mb-1 block">
                  Month Name
                </label>
                <Select value={customMonthName} onValueChange={setCustomMonthName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month.charAt(0).toUpperCase() + month.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-32">
                <label className="text-sm font-medium text-text-primary mb-1 block">
                  Year
                </label>
                <Input
                  type="number"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="2025"
                  min="2020"
                  max="2100"
                />
              </div>

              <Button
                onClick={handleAddCustomMonth}
                disabled={!customMonthName || !customYear}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAddCustomMonth(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <MealScheduleTable companyId={selectedCompanyId!} month={selectedMonth} />
      </div>
    </div>
  );
}
