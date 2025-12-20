import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store';
import type { WeeklySchedule, WeeklyMealEntry, DayOfWeek } from '@/types';
import { generateWeeklySchedulePDF } from '@/utils/weeklyPdfGenerator';

interface WeeklyScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
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

export function WeeklyScheduleDialog({ open, onClose, companyId, companyName }: WeeklyScheduleDialogProps) {
  const { addWeeklySchedule, updateWeeklySchedule, updateWeeklyScheduleRates, companies } = useStore();
  
  const [weekDates, setWeekDates] = useState(getCurrentWeekDates());
  const [entries, setEntries] = useState<WeeklyMealEntry[]>(
    DAYS.map(day => ({ day, tiffen: '', lunch: '', dinner: '' }))
  );
  const [rates, setRates] = useState({ tiffen: 0, lunch: 0, dinner: 0 });
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);
  
  const company = companies.find(c => c.id === companyId);

  useEffect(() => {
    if (open) {
      setWeekDates(getCurrentWeekDates());
      setEntries(DAYS.map(day => ({ day, tiffen: '', lunch: '', dinner: '' })));
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

  const handleSave = () => {
    if (currentScheduleId) {
      updateWeeklySchedule(currentScheduleId, entries);
      updateWeeklyScheduleRates(currentScheduleId, rates);
    } else {
      const newSchedule: WeeklySchedule = {
        id: crypto.randomUUID(),
        companyId,
        weekStartDate: weekDates.start,
        weekEndDate: weekDates.end,
        entries,
        rates,
        createdAt: new Date().toISOString()
      };
      addWeeklySchedule(newSchedule);
      setCurrentScheduleId(newSchedule.id);
    }
    alert('Weekly schedule saved successfully!');
  };

  const handleDownloadPDF = async () => {
    if (!company) return;
    
    const schedule: WeeklySchedule = {
      id: currentScheduleId || crypto.randomUUID(),
      companyId,
      weekStartDate: weekDates.start,
      weekEndDate: weekDates.end,
      entries,
      rates,
      createdAt: new Date().toISOString()
    };
    
    await generateWeeklySchedulePDF(companyName, company.accountDetails, schedule);
  };

  const calculateTotals = () => {
    const tiffenCount = entries.reduce((sum, e) => sum + (parseInt(e.tiffen?.toString() || '0') || 0), 0);
    const lunchCount = entries.reduce((sum, e) => sum + (parseInt(e.lunch?.toString() || '0') || 0), 0);
    const dinnerCount = entries.reduce((sum, e) => sum + (parseInt(e.dinner?.toString() || '0') || 0), 0);
    
    return {
      tiffenCount,
      lunchCount,
      dinnerCount,
      tiffenAmount: tiffenCount * rates.tiffen,
      lunchAmount: lunchCount * rates.lunch,
      dinnerAmount: dinnerCount * rates.dinner
    };
  };

  const totals = calculateTotals();
  const grandTotal = totals.tiffenAmount + totals.lunchAmount + totals.dinnerAmount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Schedule - {companyName}
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Week: {weekDates.start} to {weekDates.end}
          </p>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Weekly Schedule Table */}
          <Card className="overflow-hidden">
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
                            type="number"
                            value={entry?.tiffen || ''}
                            onChange={(e) => handleCellChange(day, 'tiffen', e.target.value)}
                            className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-orange-500"
                            placeholder="-"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={entry?.lunch || ''}
                            onChange={(e) => handleCellChange(day, 'lunch', e.target.value)}
                            className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-orange-500"
                            placeholder="-"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={entry?.dinner || ''}
                            onChange={(e) => handleCellChange(day, 'dinner', e.target.value)}
                            className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-orange-500"
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

          {/* Summary */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50">
            <h3 className="font-semibold mb-3 text-slate-800">Week Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600">Tiffen Count</p>
                <p className="text-lg font-semibold text-slate-800">{totals.tiffenCount}</p>
                <p className="text-sm text-slate-600">₹{totals.tiffenAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Lunch Count</p>
                <p className="text-lg font-semibold text-slate-800">{totals.lunchCount}</p>
                <p className="text-sm text-slate-600">₹{totals.lunchAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Dinner Count</p>
                <p className="text-lg font-semibold text-slate-800">{totals.dinnerCount}</p>
                <p className="text-sm text-slate-600">₹{totals.dinnerAmount.toFixed(2)}</p>
              </div>
              <div className="bg-white/50 p-3 rounded-lg">
                <p className="text-xs text-slate-600">Grand Total</p>
                <p className="text-2xl font-bold text-orange-600">₹{grandTotal.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
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
      </DialogContent>
    </Dialog>
  );
}
