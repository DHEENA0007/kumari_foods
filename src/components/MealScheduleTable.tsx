import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store';
import type { DateBasedMealEntry } from '@/types';

interface MealScheduleTableProps {
  companyId: string;
  month: string;
}

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

// Generate all dates for a given month
const generateMonthDates = (month: string): string[] => {
  const match = month.match(/^([a-z]+)(\d{4})$/i);
  if (!match) return [];

  const monthName = match[1].toLowerCase();
  const year = parseInt(match[2]);

  const monthMap: { [key: string]: number } = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  const monthIndex = monthMap[monthName];
  if (monthIndex === undefined) return [];

  const lastDay = new Date(year, monthIndex + 1, 0);
  const dates: string[] = [];

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dd = String(day).padStart(2, '0');
    const mm = String(monthIndex + 1).padStart(2, '0');
    dates.push(`${dd}-${mm}-${year}`);
  }

  return dates;
};

const getDayOfWeek = (dateStr: string) => {
  const [dd, mm, yyyy] = dateStr.split('-');
  const dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dateObj.getDay()];
};

export function MealScheduleTable({ companyId, month }: MealScheduleTableProps) {
  const { getMealSchedule, addMealSchedule, updateMealSchedule, updateMealScheduleRates } = useStore();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState('');

  const [editingRateCell, setEditingRateCell] = useState<string | null>(null);
  const [tempRateValue, setTempRateValue] = useState('');
  const [showRateInputs, setShowRateInputs] = useState<Record<string, boolean>>({});

  const schedule = getMealSchedule(companyId, month);

  const getRateValue = (date: string, mealType: 'tiffen' | 'lunch' | 'dinner') => {
    const entry = schedule?.entries.find(e => e.date === date);
    return entry?.[`${mealType}Rate` as keyof DateBasedMealEntry]?.toString() || '';
  };

  const toggleRateInput = (date: string, mealType: string) => {
    const key = `${date}-${mealType}`;
    const mType = mealType as 'tiffen' | 'lunch' | 'dinner';
    const isCurrentlyShown = showRateInputs[key] || getRateValue(date, mType) !== '';

    if (isCurrentlyShown) {
      setShowRateInputs(prev => ({ ...prev, [key]: false }));

      if (!schedule) return;
      const existingEntryIndex = schedule.entries.findIndex(e => e.date === date);
      if (existingEntryIndex >= 0) {
        const updatedEntries = [...schedule.entries];
        updatedEntries[existingEntryIndex] = {
          ...updatedEntries[existingEntryIndex],
          [`${mealType}Rate`]: undefined
        };
        updateMealSchedule(companyId, month, updatedEntries);
      }
    } else {
      setShowRateInputs(prev => ({ ...prev, [key]: true }));
    }
  };

  const isRateEditing = (date: string, mealType: string) => {
    return editingRateCell === `${date}-${mealType}`;
  };

  const handleRateCellClick = (date: string, mealType: 'tiffen' | 'lunch' | 'dinner') => {
    const cellId = `${date}-${mealType}`;
    setEditingRateCell(cellId);
    setTempRateValue(getRateValue(date, mealType));
  };

  const handleRateCellBlur = (date: string, mealType: 'tiffen' | 'lunch' | 'dinner') => {
    if (!schedule) return;

    const existingEntryIndex = schedule.entries.findIndex(e => e.date === date);
    let updatedEntries;

    if (existingEntryIndex >= 0) {
      updatedEntries = [...schedule.entries];
      updatedEntries[existingEntryIndex] = {
        ...updatedEntries[existingEntryIndex],
        [`${mealType}Rate`]: tempRateValue || undefined
      };
    } else {
      const newEntry: DateBasedMealEntry = {
        date,
        [`${mealType}Rate`]: tempRateValue || undefined
      };
      updatedEntries = [...schedule.entries, newEntry];
    }

    updateMealSchedule(companyId, month, updatedEntries);
    setEditingRateCell(null);
  };

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

    let tiffenCount = 0, lunchCount = 0, dinnerCount = 0;
    let tiffenAmount = 0, lunchAmount = 0, dinnerAmount = 0;

    const baseTiffenRate = schedule.rates?.tiffen || 0;
    const baseLunchRate = schedule.rates?.lunch || 0;
    const baseDinnerRate = schedule.rates?.dinner || 0;

    schedule.entries.forEach(e => {
      const tCount = e.tiffen ? parseInt(e.tiffen.toString()) || 0 : 0;
      const lCount = e.lunch ? parseInt(e.lunch.toString()) || 0 : 0;
      const dCount = e.dinner ? parseInt(e.dinner.toString()) || 0 : 0;

      tiffenCount += tCount;
      lunchCount += lCount;
      dinnerCount += dCount;

      tiffenAmount += tCount * (e.tiffenRate !== undefined && e.tiffenRate !== '' ? parseFloat(e.tiffenRate.toString()) : baseTiffenRate);
      lunchAmount += lCount * (e.lunchRate !== undefined && e.lunchRate !== '' ? parseFloat(e.lunchRate.toString()) : baseLunchRate);
      dinnerAmount += dCount * (e.dinnerRate !== undefined && e.dinnerRate !== '' ? parseFloat(e.dinnerRate.toString()) : baseDinnerRate);
    });

    return {
      tiffenCount,
      lunchCount,
      dinnerCount,
      tiffenAmount,
      lunchAmount,
      dinnerAmount
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
      const newEntry: DateBasedMealEntry = {
        date,
        [mealType]: tempValue || undefined
      };
      updatedEntries = [...schedule.entries, newEntry];
    }

    updateMealSchedule(companyId, month, updatedEntries);
    setEditingCell(null);
  };



  const allDates = generateMonthDates(month);
  const isEditing = (date: string, mealType: string) => {
    return editingCell === `${date}-${mealType}`;
  };

  const getValue = (date: string, mealType: 'tiffen' | 'lunch' | 'dinner') => {
    const entry = schedule?.entries.find(e => e.date === date);
    return entry?.[mealType]?.toString() || '';
  };

  // If no schedule exists, create it automatically using useEffect
  useEffect(() => {
    if (!schedule) {
      addMealSchedule(companyId, {
        companyId,
        month,
        entries: []
      });
    }
  }, [companyId, month, schedule, addMealSchedule]);

  // Auto-populate entries for all dates in the month
  useEffect(() => {
    if (schedule && allDates.length > 0) {
      const existingDates = new Set(schedule.entries.map(e => e.date));
      const missingDates = allDates.filter(date => !existingDates.has(date));

      if (missingDates.length > 0) {
        const newEntries = missingDates.map(date => ({ date }));
        const updatedEntries = [...schedule.entries, ...newEntries];
        updateMealSchedule(companyId, month, updatedEntries);
      }
    }
  }, [schedule, allDates, companyId, month, updateMealSchedule]);

  // Show loading state while schedule is being created
  if (!schedule) {
    return null;
  }

  const totals = calculateTotals();
  const grandTotal = totals.tiffenAmount + totals.lunchAmount + totals.dinnerAmount;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Rates Configuration Card */}
      <Card className="p-3 sm:p-4 bg-gradient-to-br from-brand-orange/5 to-brand-amber/5 border-brand-orange/20">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-brand-orange rounded-full"></span>
          Meal Rates (₹)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* Daily Entries Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <span className="w-1 h-4 bg-brand-orange rounded-full"></span>
          Daily Entries
        </h3>
      </div>

      {/* Entries Table */}
      <Card className="overflow-hidden border-border-light shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-sm">
                <th className="px-4 py-3 text-left font-bold text-sm">Date</th>
                <th className="px-4 py-3 text-center font-bold text-sm">Tiffen</th>
                <th className="px-4 py-3 text-center font-bold text-sm">Lunch</th>
                <th className="px-4 py-3 text-center font-bold text-sm">Dinner</th>
              </tr>
            </thead>
            <tbody>
              {allDates.map((date, index) => (
                <tr
                  key={date}
                  className={`border-b border-slate-200 transition-all duration-200 hover:bg-blue-50 hover:shadow-sm ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <div className="font-mono font-bold text-slate-800 text-sm bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block">
                        {date}
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{getDayOfWeek(date)}</span>
                    </div>
                  </td>
                  {['tiffen', 'lunch', 'dinner'].map((mealType) => (
                    <td key={mealType} className="px-4 py-3 text-center align-top">
                      <div className="flex flex-col items-center gap-1.5 min-w-[5rem]">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={isEditing(date, mealType) ? tempValue : getValue(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                            onChange={(e) => setTempValue(e.target.value)}
                            onFocus={() => handleCellClick(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                            onBlur={() => handleCellBlur(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                            placeholder="Qty"
                            title="Count"
                            className="w-14 text-center px-1 py-1.5 border border-slate-300 rounded bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                          />
                          {(showRateInputs[`${date}-${mealType}`] || getRateValue(date, mealType as 'tiffen' | 'lunch' | 'dinner')) ? (
                            <button
                              type="button"
                              onClick={() => toggleRateInput(date, mealType)}
                              className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                              title="Remove Custom Rate"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleRateInput(date, mealType)}
                              className="text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 p-1 rounded border border-dashed border-slate-300 hover:border-blue-300 flex-shrink-0 transition-colors"
                              title="Add Custom Rate"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            </button>
                          )}
                        </div>

                        {(showRateInputs[`${date}-${mealType}`] || getRateValue(date, mealType as 'tiffen' | 'lunch' | 'dinner')) && (
                          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                            <span className="text-xs text-slate-500 font-medium">₹</span>
                            <input
                              type="number"
                              value={isRateEditing(date, mealType) ? tempRateValue : getRateValue(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                              onChange={(e) => setTempRateValue(e.target.value)}
                              onFocus={() => handleRateCellClick(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                              onBlur={() => handleRateCellBlur(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                              placeholder="Rate"
                              title="Custom Rate"
                              className="w-14 text-center px-1 py-1 border border-brand-orange/40 rounded bg-orange-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Card */}
      {allDates.length > 0 && (
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-blue-50 border border-brand-orange/20">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-brand-orange rounded-full"></span>
            Summary - {formatMonthDisplay(month)}
          </h3>

          <div className="space-y-3">
            {/* Summary Table */}
            <div className="bg-white rounded-md p-2 sm:p-3 text-xs sm:text-sm">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 font-semibold text-text-secondary mb-2 pb-2 border-b border-border-light">
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
                <div key={item.type} className="grid grid-cols-4 gap-2 sm:gap-3 py-2 border-b border-border-light items-center last:border-0">
                  <div className="font-medium text-brand-orange text-xs sm:text-sm">{item.type}</div>
                  <div className="text-center font-semibold text-text-primary text-xs sm:text-sm">{item.count}</div>
                  <div className="text-center text-text-secondary text-xs sm:text-sm">₹{item.rate}</div>
                  <div className="text-center font-bold text-green-600 text-xs sm:text-sm">₹{item.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="bg-gradient-to-r from-brand-orange to-brand-amber rounded-md p-2 sm:p-3 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Grand Total</p>
                  <p className="text-lg sm:text-2xl font-bold">₹{grandTotal.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-90">Total Meals</p>
                  <p className="text-lg sm:text-xl font-bold">
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
