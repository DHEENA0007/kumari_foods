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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden mb-6">
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-orange shadow-sm"></div>
            Base Meal Rates (₹)
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Applied automatically to all daily entries</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {['tiffen', 'lunch', 'dinner'].map((mealType) => (
            <div key={mealType} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
              <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                {mealType}
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-brand-orange transition-colors">₹</span>
                <input
                  type="number"
                  value={editingRate === mealType ? tempRate : schedule?.rates?.[mealType as 'tiffen' | 'lunch' | 'dinner'] || ''}
                  onChange={(e) => setTempRate(e.target.value)}
                  onFocus={() => handleRateClick(mealType as 'tiffen' | 'lunch' | 'dinner')}
                  onBlur={() => handleRateBlur(mealType as 'tiffen' | 'lunch' | 'dinner')}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] box-border"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Entries Header & Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></div>
            Daily Entries
          </h3>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[350px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="px-3 sm:px-5 py-3 text-left font-bold text-xs uppercase tracking-wider">Date</th>
                <th className="px-2 sm:px-4 py-3 text-center font-bold text-xs uppercase tracking-wider">Tiffen</th>
                <th className="px-2 sm:px-4 py-3 text-center font-bold text-xs uppercase tracking-wider">Lunch</th>
                <th className="px-2 sm:px-4 py-3 text-center font-bold text-xs uppercase tracking-wider">Dinner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allDates.map((date) => (
                <tr
                  key={date}
                  className="bg-white hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-3 sm:px-5 py-3 sm:py-4 align-top w-[25%] sm:w-auto">
                    <div className="flex flex-col items-start gap-1">
                      <div className="font-mono font-bold text-slate-700 text-[10px] sm:text-xs bg-slate-100/80 px-2 py-1 rounded border border-slate-200/60">
                        {date}
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{getDayOfWeek(date)}</span>
                    </div>
                  </td>
                  {['tiffen', 'lunch', 'dinner'].map((mealType) => (
                    <td key={mealType} className="px-1 sm:px-4 py-2 sm:py-3 text-center align-top">
                      <div className="flex flex-col items-center gap-1.5 min-w-[3.5rem] sm:min-w-[5rem]">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={isEditing(date, mealType) ? tempValue : getValue(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                            onChange={(e) => setTempValue(e.target.value)}
                            onFocus={() => handleCellClick(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                            onBlur={() => handleCellBlur(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                            placeholder="Qty"
                            className="w-12 sm:w-16 text-center px-1 py-1.5 border border-slate-200 rounded-md bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-xs sm:text-sm placeholder:font-normal placeholder:text-slate-300"
                          />
                          {(showRateInputs[`${date}-${mealType}`] || getRateValue(date, mealType as 'tiffen' | 'lunch' | 'dinner')) ? (
                            <button
                              type="button"
                              onClick={() => toggleRateInput(date, mealType)}
                              className="text-white bg-rose-500 hover:bg-rose-600 p-1 rounded-md sm:rounded shadow-sm flex-shrink-0 transition-colors"
                              title="Remove Custom Rate"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleRateInput(date, mealType)}
                              className="text-slate-400 bg-slate-50 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md sm:rounded border border-dashed border-slate-200 hover:border-blue-300 shadow-sm flex-shrink-0 transition-all"
                              title="Add Custom Rate"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            </button>
                          )}
                        </div>

                        {(showRateInputs[`${date}-${mealType}`] || getRateValue(date, mealType as 'tiffen' | 'lunch' | 'dinner')) && (
                          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-top-1 bg-orange-50/50 p-1 rounded-md border border-brand-orange/20">
                            <span className="text-[10px] text-brand-orange font-bold pl-0.5">₹</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={isRateEditing(date, mealType) ? tempRateValue : getRateValue(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                              onChange={(e) => setTempRateValue(e.target.value)}
                              onFocus={() => handleRateCellClick(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                              onBlur={() => handleRateCellBlur(date, mealType as 'tiffen' | 'lunch' | 'dinner')}
                              placeholder="Rate"
                              className="w-10 sm:w-12 text-center px-0.5 py-0.5 border-none bg-transparent text-slate-800 text-[11px] sm:text-xs font-bold focus:outline-none focus:ring-0 placeholder:text-orange-200 placeholder:font-normal"
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
      </div>

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
