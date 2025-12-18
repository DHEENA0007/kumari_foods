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
import { generateMonthlyBillPDF } from '@/utils/pdfGenerator';
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
    if (!selectedCompany || !selectedCompanyId) return;
    
    // Get the current month's meal schedule
    const monthSchedule = mealSchedules[selectedCompanyId]?.find(s => s.month === selectedMonth);
    
    if (monthSchedule) {
      await generateMonthlyBillPDF(
        selectedCompany.name,
        selectedCompany.accountDetails,
        monthSchedule
      );
    } else {
      alert('No data available for the selected month');
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
      {/* Compact Header */}
      <div className="relative px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3 border-b border-border-light bg-gradient-to-br from-brand-orange/10 via-brand-amber/5 to-transparent">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg bg-brand-orange/10 border-2 border-brand-orange/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-brand-orange" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-text-primary truncate">{selectedCompany.name}</h1>
              <p className="text-xs text-text-secondary hidden sm:block">Monthly Schedule</p>
            </div>
          </div>

          <div className="flex gap-1 sm:gap-1.5 lg:gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-green-600 hover:bg-green-700 h-8 sm:h-9"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 animate-spin" />
              ) : (
                <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
              )}
              <span className="hidden sm:inline ml-1">Save</span>
            </Button>
            <Button
              onClick={handleDownloadPDF}
              size="sm"
              className="bg-brand-orange hover:bg-brand-orange/90 h-8 sm:h-9"
            >
              <FileDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline ml-1">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Month Selector & Controls */}
      <div className="px-2 sm:px-3 py-2 sm:py-2 lg:px-4 lg:py-3 border-b border-border-light bg-bg-surface space-y-2">
        {/* Main Month Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigateMonth('prev')}
            className="flex-shrink-0 h-8 sm:h-9"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>

          <div className="flex-1 flex items-center gap-1 sm:gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="flex-1 h-8 sm:h-9 text-xs sm:text-sm font-semibold">
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
              size="sm"
              onClick={() => setFilterMode(filterMode === 'all' ? 'existing' : 'all')}
              title={filterMode === 'existing' ? 'Show all months' : 'Show only existing months'}
              className="flex-shrink-0 h-8 sm:h-9 w-8 sm:w-9 p-0"
            >
              <ListFilter className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigateMonth('next')}
            className="flex-shrink-0 h-8 sm:h-9"
          >
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 sm:h-8 text-xs px-2"
            onClick={() => handleQuickAddMonth(0)}
          >
            Current
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 sm:h-8 text-xs px-2"
            onClick={() => handleQuickAddMonth(1)}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 sm:h-8 text-xs px-2"
            onClick={() => setShowAddCustomMonth(!showAddCustomMonth)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Custom
          </Button>

          {availableMonths.length > 0 && (
            <div className="ml-auto text-xs text-text-secondary flex items-center gap-1">
              <span className="text-green-600">●</span>
              {availableMonths.length}
            </div>
          )}
        </div>

        {/* Add Custom Month Form */}
        {showAddCustomMonth && (
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-text-primary mb-1 block">
                  Month Name
                </label>
                <Select value={customMonthName} onValueChange={setCustomMonthName}>
                  <SelectTrigger className="h-8 text-xs">
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
              
              <div className="w-24">
                <label className="text-xs font-medium text-text-primary mb-1 block">
                  Year
                </label>
                <Input
                  type="number"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="2025"
                  min="2020"
                  max="2100"
                  className="h-8 text-xs"
                />
              </div>

              <Button
                onClick={handleAddCustomMonth}
                disabled={!customMonthName || !customYear}
                size="sm"
                className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCustomMonth(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 overflow-y-auto px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
        <MealScheduleTable companyId={selectedCompanyId!} month={selectedMonth} />
      </div>
    </div>
  );
}
