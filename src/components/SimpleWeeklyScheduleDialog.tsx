import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store';
import type { WeeklySchedule, WeeklyMealEntry, DayOfWeek } from '@/types';
import { generateWeeklySchedulePDF } from '@/utils/weeklyPdfGenerator';

interface SimpleWeeklyScheduleDialogProps {
  open: boolean;
  onClose: () => void;
}

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'திங்கள்',
  tuesday: 'செவ்வாய்',
  wednesday: 'புதன்',
  thursday: 'வியாழன்',
  friday: 'வெள்ளி',
  saturday: 'சனி',
  sunday: 'ஞாயிறு'
};

// Default weekly schedule template
const DEFAULT_SCHEDULE: Record<DayOfWeek, { tiffen: string; lunch: string; dinner: string }> = {
  monday: { tiffen: 'இட்லி,வடை', lunch: 'சாப்பாடு', dinner: 'தோசை' },
  tuesday: { tiffen: 'பொங்கல்,வடை', lunch: 'சாப்பாடு', dinner: 'இட்லி' },
  wednesday: { tiffen: 'பூரி', lunch: 'பிரிஞ்சி', dinner: 'சப்பாத்தி' },
  thursday: { tiffen: 'இட்லி,வடை', lunch: 'சாப்பாடு', dinner: 'இட்லி' },
  friday: { tiffen: 'பூரி', lunch: 'தக்காளி', dinner: 'தோசை' },
  saturday: { tiffen: 'பொங்கல்,வடை', lunch: 'சாப்பாடு', dinner: 'இட்லி' },
  sunday: { tiffen: 'இட்லி,வடை', lunch: 'பிரிஞ்சி', dinner: '-' }
};

// Get current week start and end dates
const getCurrentWeekDates = (): { start: string; end: string } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday

  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  };
};

export function SimpleWeeklyScheduleDialog({ open, onClose }: SimpleWeeklyScheduleDialogProps) {
  const { addWeeklySchedule, updateWeeklySchedule, updateWeeklyScheduleRates, weeklySchedules } = useStore();

  const [weekDates, setWeekDates] = useState(getCurrentWeekDates());
  const [entries, setEntries] = useState<WeeklyMealEntry[]>(
    DAYS.map(day => ({ day, tiffen: '', lunch: '', dinner: '' }))
  );
  const [rates, setRates] = useState({ tiffen: 0, lunch: 0, dinner: 0 });
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const dates = getCurrentWeekDates();
      setWeekDates(dates);

      // Try to find existing saved schedule for "general" (header schedule)
      const existingSchedule = weeklySchedules.find(s => s.companyId === 'general');

      if (existingSchedule) {
        // Load saved schedule
        setEntries(existingSchedule.entries);
        setRates({
          tiffen: existingSchedule.rates?.tiffen ?? 0,
          lunch: existingSchedule.rates?.lunch ?? 0,
          dinner: existingSchedule.rates?.dinner ?? 0
        });
        setCurrentScheduleId(existingSchedule.id);
      } else {
        // Load default schedule on first use
        setEntries(DAYS.map(day => ({
          day,
          tiffen: DEFAULT_SCHEDULE[day].tiffen,
          lunch: DEFAULT_SCHEDULE[day].lunch,
          dinner: DEFAULT_SCHEDULE[day].dinner
        })));
        setRates({ tiffen: 0, lunch: 0, dinner: 0 });
        setCurrentScheduleId(null);
      }
    }
  }, [open, weeklySchedules]);

  const handleCellChange = (day: DayOfWeek, field: 'tiffen' | 'lunch' | 'dinner', value: string) => {
    setEntries(prev => prev.map(entry =>
      entry.day === day ? { ...entry, [field]: value } : entry
    ));
  };

  const handleRateChange = (field: 'tiffen' | 'lunch' | 'dinner', value: string) => {
    setRates(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSave = async () => {
    try {
      if (currentScheduleId) {
        await updateWeeklySchedule(currentScheduleId, entries);
        await updateWeeklyScheduleRates(currentScheduleId, rates);
      } else {
        const newSchedule: WeeklySchedule = {
          id: crypto.randomUUID(),
          companyId: 'general', // General schedule without company
          weekStartDate: weekDates.start,
          weekEndDate: weekDates.end,
          entries,
          rates,
          createdAt: new Date().toISOString()
        };
        await addWeeklySchedule(newSchedule);
        setCurrentScheduleId(newSchedule.id);
      }
      alert('Weekly schedule saved successfully!');
    } catch (error) {
      console.error('Failed to save weekly schedule:', error);
      alert('Failed to save weekly schedule. Please try again.');
    }
  };

  const handleDownloadPDF = async () => {
    const fileName = `Weekly_Schedule_${weekDates.start}_to_${weekDates.end}`;
    await generateWeeklySchedulePDF('weekly-schedule-table', fileName);
  };

  const handleLoadDefault = () => {
    setEntries(DAYS.map(day => ({
      day,
      tiffen: DEFAULT_SCHEDULE[day].tiffen,
      lunch: DEFAULT_SCHEDULE[day].lunch,
      dinner: DEFAULT_SCHEDULE[day].dinner
    })));
  };

  const handleClearAll = () => {
    setEntries(DAYS.map(day => ({ day, tiffen: '', lunch: '', dinner: '' })));
  };

  const calculateTotals = () => {
    // Count non-empty entries instead of summing numbers
    const tiffenCount = entries.filter(e => e.tiffen && e.tiffen.toString().trim() !== '').length;
    const lunchCount = entries.filter(e => e.lunch && e.lunch.toString().trim() !== '').length;
    const dinnerCount = entries.filter(e => e.dinner && e.dinner.toString().trim() !== '').length;

    return {
      tiffenCount,
      lunchCount,
      dinnerCount
    };
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-xl shadow-xl border-0 bg-white">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 noto-sans-tamil text-xl font-bold text-slate-800">
                <div className="w-8 h-8 rounded-lg bg-orange-100 border-2 border-orange-200 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
                வாராந்திர அட்டவணை
              </DialogTitle>
              <p className="text-sm text-slate-500 noto-sans-tamil font-medium mt-1">
                வாரம்: <span className="text-slate-700">{weekDates.start}</span> முதல் <span className="text-slate-700">{weekDates.end}</span> வரை
              </p>
            </div>

            <DialogClose asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* PDF Content Container */}
          <div id="weekly-schedule-table" className="space-y-4">
            {/* Rates Configuration - Moved to Top */}
            <Card className="p-4 sm:p-5 bg-gradient-to-br from-orange-50/80 to-amber-50/80 border border-orange-100 shadow-sm rounded-xl">
              <h3 className="font-bold mb-4 text-slate-800 noto-sans-tamil flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                உணவு விலை பட்டியல்
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                  <label className="text-xs font-bold text-slate-600 noto-sans-tamil block mb-1.5">காலை உணவு விலை (₹)</label>
                  <input
                    type="number"
                    value={rates.tiffen}
                    onChange={(e) => handleRateChange('tiffen', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-semibold"
                    placeholder="0.00"
                  />
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                  <label className="text-xs font-bold text-slate-600 noto-sans-tamil block mb-1.5">மதிய உணவு விலை (₹)</label>
                  <input
                    type="number"
                    value={rates.lunch}
                    onChange={(e) => handleRateChange('lunch', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-semibold"
                    placeholder="0.00"
                  />
                </div>
                <div className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                  <label className="text-xs font-bold text-slate-600 noto-sans-tamil block mb-1.5">இரவு உணவு விலை (₹)</label>
                  <input
                    type="number"
                    value={rates.dinner}
                    onChange={(e) => handleRateChange('dinner', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </Card>

            {/* Weekly Schedule Table */}
            <Card className="overflow-hidden border border-slate-200/60 shadow-lg rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-sm">
                      <th className="px-4 py-3 sm:px-5 sm:py-4 text-left text-sm font-bold noto-sans-tamil w-[15%]">நாள்</th>
                      <th className="px-4 py-3 sm:px-5 sm:py-4 text-center text-sm font-bold noto-sans-tamil w-[28.33%]">காலை</th>
                      <th className="px-4 py-3 sm:px-5 sm:py-4 text-center text-sm font-bold noto-sans-tamil w-[28.33%]">மதியம்</th>
                      <th className="px-4 py-3 sm:px-5 sm:py-4 text-center text-sm font-bold noto-sans-tamil w-[28.33%]">இரவு</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day, index) => {
                      const entry = entries.find(e => e.day === day);
                      return (
                        <tr key={day} className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="px-4 py-3 sm:px-5 sm:py-4 text-sm font-bold text-slate-700 noto-sans-tamil">{DAY_LABELS[day]}</td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            <input
                              type="text"
                              value={entry?.tiffen || ''}
                              onChange={(e) => handleCellChange(day, 'tiffen', e.target.value)}
                              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-center text-sm font-medium border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all bg-white shadow-sm placeholder:text-slate-300 noto-sans-tamil"
                              placeholder="-"
                            />
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            <input
                              type="text"
                              value={entry?.lunch || ''}
                              onChange={(e) => handleCellChange(day, 'lunch', e.target.value)}
                              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-center text-sm font-medium border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all bg-white shadow-sm placeholder:text-slate-300 noto-sans-tamil"
                              placeholder="-"
                            />
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            <input
                              type="text"
                              value={entry?.dinner || ''}
                              onChange={(e) => handleCellChange(day, 'dinner', e.target.value)}
                              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-center text-sm font-medium border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all bg-white shadow-sm placeholder:text-slate-300 noto-sans-tamil"
                              placeholder="-"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Summary */}
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-blue-50 border border-blue-100 rounded-xl">
            <h3 className="font-bold mb-4 text-slate-800 noto-sans-tamil flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              வார சுருக்கம்
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center py-4 px-2 sm:p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 mb-1 sm:mb-2 noto-sans-tamil uppercase">காலை</p>
                <p className="text-2xl sm:text-3xl font-black text-orange-500">{totals.tiffenCount}</p>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 noto-sans-tamil">நாட்கள்</p>
              </div>
              <div className="text-center py-4 px-2 sm:p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 mb-1 sm:mb-2 noto-sans-tamil uppercase">மதியம்</p>
                <p className="text-2xl sm:text-3xl font-black text-blue-500">{totals.lunchCount}</p>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 noto-sans-tamil">நாட்கள்</p>
              </div>
              <div className="text-center py-4 px-2 sm:p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 mb-1 sm:mb-2 noto-sans-tamil uppercase">இரவு</p>
                <p className="text-2xl sm:text-3xl font-black text-purple-500">{totals.dinnerCount}</p>
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 mt-1 noto-sans-tamil">நாட்கள்</p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between pt-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleLoadDefault} className="flex-1 sm:flex-none border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-semibold noto-sans-tamil">
                இயல்புநிலை
              </Button>
              <Button variant="outline" onClick={handleClearAll} className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 font-semibold noto-sans-tamil">
                அழி
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto border-slate-200 text-slate-700 font-semibold noto-sans-tamil">
                ரத்து
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm noto-sans-tamil">
                சேமி
              </Button>
              <Button onClick={handleDownloadPDF} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 font-semibold shadow-sm noto-sans-tamil">
                PDF பதிவிறக்கு
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
