import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
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
  const { addWeeklySchedule, updateWeeklySchedule, updateWeeklyScheduleRates } = useStore();

  const [weekDates, setWeekDates] = useState(getCurrentWeekDates());
  const [entries, setEntries] = useState<WeeklyMealEntry[]>(
    DAYS.map(day => ({ day, tiffen: '', lunch: '', dinner: '' }))
  );
  const [rates, setRates] = useState({ tiffen: 0, lunch: 0, dinner: 0 });
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setWeekDates(getCurrentWeekDates());
      // Load default schedule on first open
      setEntries(DAYS.map(day => ({
        day,
        tiffen: DEFAULT_SCHEDULE[day].tiffen,
        lunch: DEFAULT_SCHEDULE[day].lunch,
        dinner: DEFAULT_SCHEDULE[day].dinner
      })));
      setRates({ tiffen: 0, lunch: 0, dinner: 0 });
      setCurrentScheduleId(null);
    }
  }, [open]);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Schedule
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Week: {weekDates.start} to {weekDates.end}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Weekly Schedule Table */}
          <Card id="weekly-schedule-table" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Day</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Tiffen</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Lunch</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, index) => {
                    const entry = entries.find(e => e.day === day);
                    return (
                      <tr key={day} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-700">{DAY_LABELS[day]}</td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entry?.tiffen || ''}
                            onChange={(e) => handleCellChange(day, 'tiffen', e.target.value)}
                            className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-orange-500 noto-sans-tamil"
                            placeholder="-"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entry?.lunch || ''}
                            onChange={(e) => handleCellChange(day, 'lunch', e.target.value)}
                            className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-orange-500 noto-sans-tamil"
                            placeholder="-"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entry?.dinner || ''}
                            onChange={(e) => handleCellChange(day, 'dinner', e.target.value)}
                            className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-orange-500 noto-sans-tamil"
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

          {/* Rates Configuration */}
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50">
            <h3 className="font-semibold mb-3 text-slate-800">Meal Rates</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Tiffen Rate</label>
                <input
                  type="number"
                  value={rates.tiffen}
                  onChange={(e) => handleRateChange('tiffen', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Lunch Rate</label>
                <input
                  type="number"
                  value={rates.lunch}
                  onChange={(e) => handleRateChange('lunch', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Dinner Rate</label>
                <input
                  type="number"
                  value={rates.dinner}
                  onChange={(e) => handleRateChange('dinner', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </Card>

          {/* Summary */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50">
            <h3 className="font-semibold mb-3 text-slate-800">Week Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Tiffen</p>
                <p className="text-3xl font-bold text-orange-600">{totals.tiffenCount}</p>
                <p className="text-xs text-slate-500 mt-1">Days Filled</p>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Lunch</p>
                <p className="text-3xl font-bold text-blue-600">{totals.lunchCount}</p>
                <p className="text-xs text-slate-500 mt-1">Days Filled</p>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Dinner</p>
                <p className="text-3xl font-bold text-purple-600">{totals.dinnerCount}</p>
                <p className="text-xs text-slate-500 mt-1">Days Filled</p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLoadDefault} className="border-green-500 text-green-600 hover:bg-green-50">
                Load Default
              </Button>
              <Button variant="outline" onClick={handleClearAll} className="border-red-500 text-red-600 hover:bg-red-50">
                Clear All
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                Save Schedule
              </Button>
              <Button onClick={handleDownloadPDF} className="bg-orange-600 hover:bg-orange-700">
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
