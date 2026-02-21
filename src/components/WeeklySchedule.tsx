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
      <div className="h-full min-h-[60vh] flex items-center justify-center text-slate-500 bg-slate-50/30">
        <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-full h-full rounded-2xl bg-white border border-slate-200/60 shadow-sm rotate-3 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-blue-400 -rotate-3" />
            </div>
          </div>
          <div className="space-y-1.5 px-4">
            <p className="text-xl font-bold text-slate-800 tracking-tight">No company selected</p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              Please choose a company from the sidebar to view or manage its monthly meal schedules.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Clean Premium Header */}
      <div className="relative px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-100/50 flex items-center justify-center flex-shrink-0 shadow-sm">
              <img src="/Logo.png" alt="Company Icon" className="w-6 h-6 sm:w-8 sm:h-8 opacity-80 mix-blend-multiply" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange hidden" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-800 tracking-tight leading-tight truncate">{selectedCompany.name}</h1>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mt-0.5">Monthly Schedule</p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 text-white h-10 flex-1 sm:flex-none border-0 transition-all rounded-lg"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="ml-2 font-bold tracking-wide">Save</span>
            </Button>
            <Button
              onClick={handleDownloadPDF}
              size="sm"
              className="bg-brand-orange hover:bg-[#E65A20] shadow-sm shadow-brand-orange/20 text-white h-10 flex-1 sm:flex-none border-0 transition-all rounded-lg"
            >
              <FileDown className="w-4 h-4" />
              <span className="ml-2 font-bold tracking-wide">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sleek Controls Toolbar */}
      <div className="px-4 py-3 sm:px-6 lg:px-8 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-20 space-y-3">
        {/* Main Month Navigation */}
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center justify-between">
          <div className="flex items-center gap-2 w-full xl:w-auto bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigateMonth('prev')}
              className="flex-shrink-0 h-9 w-9 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="flex-1 xl:w-48 h-9 text-sm font-bold border-0 bg-transparent focus:ring-0 shadow-none text-slate-700 mx-1">
                <SelectValue>
                  {formatMonthDisplay(selectedMonth)}
                  {!hasDataForMonth && filterMode === 'existing' && ' (No Data)'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-slate-100 shadow-xl rounded-xl">
                {(filterMode === 'existing' ? availableMonths : [selectedMonth, ...availableMonths.filter(m => m !== selectedMonth)]).map((month) => (
                  <SelectItem key={month} value={month} className="font-medium cursor-pointer rounded-lg focus:bg-slate-50">
                    {formatMonthDisplay(month)}
                    {availableMonths.includes(month) && (
                      <span className="ml-2 text-emerald-500 inline-block translate-y-[-1px]">●</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleNavigateMonth('next')}
              className="flex-shrink-0 h-9 w-9 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 hide-scrollbar no-scrollbar w-full xl:w-auto">
            <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
              <Button
                variant={filterMode === 'existing' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterMode(filterMode === 'all' ? 'existing' : 'all')}
                title={filterMode === 'existing' ? 'Show all months' : 'Show only existing months'}
                className={`flex-shrink-0 h-9 px-3 rounded-lg transition-all ${filterMode === 'existing' ? 'bg-white shadow-sm text-slate-800 border border-slate-200/80 font-bold hover:bg-white hover:text-slate-800' : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                <ListFilter className="w-4 h-4 mr-1.5" />
                <span className="text-xs sm:text-sm">Filter</span>
              </Button>

              <div className="h-4 w-px bg-slate-300/50 mx-1.5 hidden sm:block"></div>

              <div className="flex bg-white/50 rounded-lg p-0.5 ml-1 sm:ml-0 gap-0.5 border border-slate-200/30">
                <Button variant="ghost" size="sm" className="h-8 text-[11px] sm:text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-white shadow-sm transition-all rounded-md px-2.5" onClick={() => handleQuickAddMonth(0)}>Current</Button>
                <Button variant="ghost" size="sm" className="h-8 text-[11px] sm:text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-white shadow-sm transition-all rounded-md px-2.5" onClick={() => handleQuickAddMonth(1)}>Next</Button>
                <Button variant="ghost" size="sm" className="h-8 text-[11px] sm:text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-white shadow-sm transition-all rounded-md px-2.5 flex items-center pr-3" onClick={() => setShowAddCustomMonth(!showAddCustomMonth)}>
                  <Plus className="w-3 h-3 mr-1" /> Custom
                </Button>
              </div>
            </div>

            {availableMonths.length > 0 && (
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-auto pl-2 uppercase tracking-wide whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                {availableMonths.length} Saved
              </div>
            )}
          </div>
        </div>

        {/* Add Custom Month Form */}
        {showAddCustomMonth && (
          <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200/60 rounded-xl shadow-inner mt-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[140px]">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Month
                </label>
                <Select value={customMonthName} onValueChange={setCustomMonthName}>
                  <SelectTrigger className="h-10 text-sm font-semibold bg-white border-slate-200 focus:ring-blue-500/20">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-100 shadow-xl rounded-xl">
                    {MONTH_NAMES.map((month) => (
                      <SelectItem key={month} value={month} className="font-medium cursor-pointer rounded-lg focus:bg-slate-50">
                        {month.charAt(0).toUpperCase() + month.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-28 sm:w-32">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                  Year
                </label>
                <Input
                  type="number"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  placeholder="2025"
                  min="2020"
                  max="2100"
                  className="h-10 text-sm font-semibold bg-white border-slate-200 focus:ring-blue-500/20"
                />
              </div>

              <Button
                onClick={handleAddCustomMonth}
                disabled={!customMonthName || !customYear}
                className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide shadow-sm sm:w-24 w-full"
              >
                Add Month
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowAddCustomMonth(false)}
                className="h-10 px-3 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg hidden sm:flex"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Table Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-[1400px] mx-auto">
          <MealScheduleTable companyId={selectedCompanyId!} month={selectedMonth} />
        </div>
      </div>
    </div>
  );
}
