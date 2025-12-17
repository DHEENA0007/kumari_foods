import { useState } from 'react';
import { Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store';
import type { DateBasedMealEntry } from '@/types';

interface MealScheduleTableProps {
  companyId: string;
  month: string;
}

// Convert YYYY-MM-DD to DD-MM-YYYY
const formatDateToDDMMYYYY = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
};

// Format month for display
const formatMonthDisplay = (month: string): string => {
  const match = month.match(/^([a-z]+)(\d{4})$/i);
  if (match) {
    const monthName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const year = match[2];
    return `${monthName} ${year}`;
  }
  return month;
};

export function MealScheduleTable({ companyId, month }: MealScheduleTableProps) {
  const { getMealSchedule, addMealSchedule, updateMealSchedule, updateMealScheduleRates } = useStore();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState('');

  const schedule = getMealSchedule(companyId, month);

  const handleRateClick = (mealType: 'tiffen' | 'lunch' | 'dinner') => {
    setEditingRate(mealType);
    setTempRate(schedule?.rates?.[mealType]?.toString() || '');
  };

  const handleRateBlur = async (mealType: 'tiffen' | 'lunch' | 'dinner') => {
    if (!schedule) return;
    
    const rateValue = tempRate ? parseFloat(tempRate) : undefined;
    
    const updatedRates = {
      ...schedule.rates,
      [mealType]: rateValue
    };
    
    await updateMealScheduleRates(companyId, month, updatedRates);
    
    setEditingRate(null);
    setTempRate('');
  };

  const calculateTotals = () => {
    if (!schedule) return { 
      tiffenCount: 0, 
      lunchCount: 0, 
      dinnerCount: 0,
      tiffenAmount: 0,
      lunchAmount: 0,
      dinnerAmount: 0
    };
    
    const tiffenCount = schedule.entries.reduce((sum, e) => sum + (e.tiffen ? parseInt(e.tiffen.toString()) || 0 : 0), 0);
    const lunchCount = schedule.entries.reduce((sum, e) => sum + (e.lunch ? parseInt(e.lunch.toString()) || 0 : 0), 0);
    const dinnerCount = schedule.entries.reduce((sum, e) => sum + (e.dinner ? parseInt(e.dinner.toString()) || 0 : 0), 0);
    
    return {
      tiffenCount,
      lunchCount,
      dinnerCount,
      tiffenAmount: tiffenCount * (schedule.rates?.tiffen || 0),
      lunchAmount: lunchCount * (schedule.rates?.lunch || 0),
      dinnerAmount: dinnerCount * (schedule.rates?.dinner || 0)
    };
  };

  const handleCellClick = (date: string, mealType: 'tiffen' | 'lunch' | 'dinner') => {
    const cellId = `${date}-${mealType}`;
    setEditingCell(cellId);
    const entry = schedule?.entries.find(e => e.date === date);
    setTempValue(entry?.[mealType]?.toString() || '');
  };

  const handleCellBlur = (date: string, mealType: 'tiffen' | 'lunch' | 'dinner') => {
    if (!schedule) return;

    const existingEntryIndex = schedule.entries.findIndex(e => e.date === date);
    let updatedEntries;

    if (existingEntryIndex >= 0) {
      updatedEntries = [...schedule.entries];
      updatedEntries[existingEntryIndex] = {
        ...updatedEntries[existingEntryIndex],
        [mealType]: tempValue || undefined
      };
    } else {
      const newEntry: DateBasedMealEntry = { date };
      newEntry[mealType] = tempValue || undefined;
      updatedEntries = [...schedule.entries, newEntry];
    }

    updateMealSchedule(companyId, month, updatedEntries);
    setEditingCell(null);
  };

  const handleAddDate = () => {
    setShowDatePicker(true);
  };

  const handleDateSelected = (isoDate: string) => {
    if (!schedule) return;
    if (isoDate && isoDate.trim()) {
      const ddmmyyyyDate = formatDateToDDMMYYYY(isoDate);
      const newEntry: DateBasedMealEntry = { date: ddmmyyyyDate };
      const updated = [...schedule.entries, newEntry];
      updateMealSchedule(companyId, month, updated);
      setShowDatePicker(false);
      setSelectedDate('');
    }
  };

  const handleDeleteDate = (date: string) => {
    if (!schedule) return;
    const updated = schedule.entries.filter(e => e.date !== date);
    updateMealSchedule(companyId, month, updated);
  };

  const sampleDates = schedule?.entries.map(e => e.date) || [];

  const isEditing = (date: string, mealType: string) => {
    return editingCell === `${date}-${mealType}`;
  };

  const getValue = (date: string, mealType: 'tiffen' | 'lunch' | 'dinner') => {
    const entry = schedule?.entries.find(e => e.date === date);
    return entry?.[mealType]?.toString() || '';
  };

  // If no schedule exists, create it automatically
  if (!schedule) {
    addMealSchedule(companyId, {
      companyId,
      month,
      entries: []
    });
    return null;
  }

  const totals = calculateTotals();
  const grandTotal = totals.tiffenAmount + totals.lunchAmount + totals.dinnerAmount;

  return (
    <div className="space-y-4">
      {/* Rates Configuration Card */}
      <Card className="p-4 bg-gradient-to-br from-brand-orange/5 to-brand-amber/5 border-brand-orange/20">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-brand-orange rounded-full"></span>
          Meal Rates (₹)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {['tiffen', 'lunch', 'dinner'].map((mealType) => (
            <div key={mealType} className="bg-white rounded-md p-2 border border-border-light">
              <label className="text-xs font-medium text-text-secondary block mb-1 capitalize">
                {mealType}
              </label>
              <input
                type="number"
                value={editingRate === mealType ? tempRate : schedule?.rates?.[mealType as 'tiffen' | 'lunch' | 'dinner'] || ''}
                onChange={(e) => setTempRate(e.target.value)}
                onFocus={() => handleRateClick(mealType as 'tiffen' | 'lunch' | 'dinner')}
                onBlur={() => handleRateBlur(mealType as 'tiffen' | 'lunch' | 'dinner')}
                placeholder="0"
                className="w-full text-base font-semibold text-text-primary p-1.5 border border-border-light rounded focus:outline-none focus:border-brand-orange transition-colors"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Add Date Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <span className="w-1 h-4 bg-brand-orange rounded-full"></span>
          Daily Entries
        </h3>
        {!showDatePicker && (
          <Button 
            onClick={handleAddDate}
            size="sm"
            className="bg-brand-orange hover:bg-brand-orange/90"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Date
          </Button>
        )}
      </div>

      {/* Date Picker */}
      {showDatePicker && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              autoFocus
              className="flex-1 px-3 py-1.5 border border-blue-300 rounded bg-white text-text-primary text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <Button
              onClick={() => handleDateSelected(selectedDate)}
              disabled={!selectedDate}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add
            </Button>
            <Button
              onClick={() => {
                setShowDatePicker(false);
                setSelectedDate('');
              }}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Entries Table */}
      {sampleDates.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed border-border-light">
          <CalendarIcon className="w-12 h-12 mx-auto text-text-secondary mb-3 opacity-50" />
          <p className="text-base font-medium text-text-secondary mb-1">No entries yet</p>
          <p className="text-sm text-text-secondary">Add your first date to start tracking meals</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border-light shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-orange to-brand-amber text-white">
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-center font-semibold">Tiffen</th>
                  <th className="px-3 py-2 text-center font-semibold">Lunch</th>
                  <th className="px-3 py-2 text-center font-semibold">Dinner</th>
                  <th className="px-3 py-2 text-center font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody>
                {sampleDates.map((date, idx) => (
                  <tr 
                    key={date} 
                    className={`border-b border-border-light transition-colors hover:bg-brand-orange/5 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-bg-surface'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-mono font-semibold text-text-primary text-sm">{date}</div>
                    </td>
                    {['tiffen', 'lunch', 'dinner'].map((mealType) => (
                      <td key={mealType} className="px-2 py-1 text-center">
                        <input
                          type="text"
                          value={isEditing(date, mealType) ? tempValue : getValue(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                          onChange={(e) => setTempValue(e.target.value)}
                          onFocus={() => handleCellClick(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                          onBlur={() => handleCellBlur(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                          placeholder="-"
                          className="w-16 text-center px-2 py-1 border border-transparent rounded bg-transparent text-text-primary font-medium focus:outline-none focus:border-brand-orange focus:bg-white transition-all"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => handleDeleteDate(date)}
                        className="p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Summary Card */}
      {sampleDates.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border border-brand-orange/20">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-brand-orange rounded-full"></span>
            Summary - {formatMonthDisplay(month)}
          </h3>
          
          <div className="space-y-3">
            {/* Summary Table */}
            <div className="bg-white rounded-md p-3 text-sm">
              <div className="grid grid-cols-4 gap-3 font-semibold text-text-secondary mb-2 pb-2 border-b border-border-light">
                <div>Meal</div>
                <div className="text-center">Count</div>
                <div className="text-center">Rate</div>
                <div className="text-center">Amount</div>
              </div>

              {[
                { type: 'Tiffen', count: totals.tiffenCount, rate: schedule?.rates?.tiffen || 0, amount: totals.tiffenAmount },
                { type: 'Lunch', count: totals.lunchCount, rate: schedule?.rates?.lunch || 0, amount: totals.lunchAmount },
                { type: 'Dinner', count: totals.dinnerCount, rate: schedule?.rates?.dinner || 0, amount: totals.dinnerAmount }
              ].map((item) => (
                <div key={item.type} className="grid grid-cols-4 gap-3 py-2 border-b border-border-light items-center last:border-0">
                  <div className="font-medium text-brand-orange">{item.type}</div>
                  <div className="text-center font-semibold text-text-primary">{item.count}</div>
                  <div className="text-center text-text-secondary">₹{item.rate}</div>
                  <div className="text-center font-bold text-green-600">₹{item.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="bg-gradient-to-r from-brand-orange to-brand-amber rounded-md p-3 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Grand Total</p>
                  <p className="text-2xl font-bold">₹{grandTotal.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-90">Total Meals</p>
                  <p className="text-xl font-bold">
                    {totals.tiffenCount + totals.lunchCount + totals.dinnerCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
