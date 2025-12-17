import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store';
import { DAYS, MEAL_TIMES, formatDayName, formatMealTime } from '@/utils';
import type { DayOfWeek, MealTime } from '@/types';

interface WeeklyMealScheduleProps {
  companyId: string;
}

const mealTimeColors = {
  morning: 'bg-amber-50 border-amber-200 text-amber-700',
  Afternoon: 'bg-orange-50 border-orange-200 text-orange-700',
  night: 'bg-indigo-50 border-indigo-200 text-indigo-700',
};

const mealTimeIcons = {
  morning: '☀️',
  Afternoon: '🌅',
  night: '🌙',
};

type WeeklyMeal = {
  day: DayOfWeek;
  mealTime: MealTime;
  foodName: string;
};

type WeeklyScheduleData = Record<number, WeeklyMeal[]>; // week number -> meals

export function WeeklyMealSchedule({ companyId }: WeeklyMealScheduleProps) {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState('');
  
  // Load week-specific schedule from localStorage
  const [weekSchedules, setWeekSchedules] = useState<WeeklyScheduleData>(() => {
    const stored = localStorage.getItem(`weeklySchedule_${companyId}`);
    return stored ? JSON.parse(stored) : {};
  });
  
  // Load week-specific rates from localStorage
  const [rates, setRates] = useState<Record<number, { morning?: number; Afternoon?: number; night?: number }>>(() => {
    const stored = localStorage.getItem(`weeklyRates_${companyId}`);
    return stored ? JSON.parse(stored) : { 1: {} };
  });

  const weekKey = `week${currentWeek}`;
  const currentWeekMeals = weekSchedules[currentWeek] || [];

  const handleCellClick = (day: DayOfWeek, mealTime: MealTime) => {
    const cellId = `${weekKey}-${day}-${mealTime}`;
    setEditingCell(cellId);
    const meal = currentWeekMeals.find(m => m.day === day && m.mealTime === mealTime);
    setTempValue(meal?.foodName || '');
  };

  const handleCellBlur = (day: DayOfWeek, mealTime: MealTime) => {
    // Update or add meal for current week
    const updatedMeals = [...currentWeekMeals];
    const existingIndex = updatedMeals.findIndex(m => m.day === day && m.mealTime === mealTime);
    
    if (existingIndex >= 0) {
      if (tempValue) {
        updatedMeals[existingIndex] = { day, mealTime, foodName: tempValue };
      } else {
        updatedMeals.splice(existingIndex, 1); // Remove if empty
      }
    } else if (tempValue) {
      updatedMeals.push({ day, mealTime, foodName: tempValue });
    }
    
    // Update state and localStorage
    const newSchedules = { ...weekSchedules, [currentWeek]: updatedMeals };
    setWeekSchedules(newSchedules);
    localStorage.setItem(`weeklySchedule_${companyId}`, JSON.stringify(newSchedules));
    
    setEditingCell(null);
  };

  const handleRateClick = (mealTime: MealTime) => {
    setEditingRate(`${weekKey}-${mealTime}`);
    setTempRate(rates[currentWeek]?.[mealTime]?.toString() || '');
  };

  const handleRateBlur = (mealTime: MealTime) => {
    const rateValue = tempRate ? parseFloat(tempRate) : undefined;
    const newRates = {
      ...rates,
      [currentWeek]: {
        ...rates[currentWeek],
        [mealTime]: rateValue
      }
    };
    setRates(newRates);
    localStorage.setItem(`weeklyRates_${companyId}`, JSON.stringify(newRates));
    setEditingRate(null);
    setTempRate('');
  };

  const getMealValue = (day: DayOfWeek, mealTime: MealTime) => {
    const meal = currentWeekMeals.find(m => m.day === day && m.mealTime === mealTime);
    return meal?.foodName || '';
  };

  const isEditing = (day: DayOfWeek, mealTime: MealTime) => {
    return editingCell === `${weekKey}-${day}-${mealTime}`;
  };

  const calculateTotals = () => {
    const morningCount = DAYS.reduce((sum, day) => {
      const value = getMealValue(day, 'morning');
      return sum + (value ? parseInt(value) || 0 : 0);
    }, 0);
    
    const AfternoonCount = DAYS.reduce((sum, day) => {
      const value = getMealValue(day, 'Afternoon');
      return sum + (value ? parseInt(value) || 0 : 0);
    }, 0);
    
    const nightCount = DAYS.reduce((sum, day) => {
      const value = getMealValue(day, 'night');
      return sum + (value ? parseInt(value) || 0 : 0);
    }, 0);

    return {
      morningCount,
      AfternoonCount,
      nightCount,
      morningAmount: morningCount * (rates[currentWeek]?.morning || 0),
      AfternoonAmount: AfternoonCount * (rates[currentWeek]?.Afternoon || 0),
      nightAmount: nightCount * (rates[currentWeek]?.night || 0)
    };
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const { saveToStorage } = useStore.getState();
      
      // Save rates to localStorage
      localStorage.setItem(`weeklyRates_${companyId}`, JSON.stringify(rates));
      
      await saveToStorage();
      setIsExpanded(false);
      
      alert('✓ Weekly schedule saved to database successfully!');
    } catch (error) {
      console.error('Failed to save to database:', error);
      alert('✗ Failed to save to database. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevWeek = () => {
    if (currentWeek > 1) {
      setCurrentWeek(currentWeek - 1);
    }
  };

  const handleNextWeek = () => {
    setCurrentWeek(currentWeek + 1);
    if (!rates[currentWeek + 1]) {
      setRates(prev => ({ ...prev, [currentWeek + 1]: {} }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-bg-surface p-4 rounded-lg border border-border-light">
        <Button variant="ghost" size="icon" onClick={handlePrevWeek} disabled={currentWeek === 1}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold text-text-primary flex-1 text-center">Week {currentWeek}</h2>
        <Button variant="ghost" size="icon" onClick={handleNextWeek}>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2"
          title={isExpanded ? "Collapse table" : "Expand table"}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </Button>
      </div>

      {/* Table - Collapsible */}
      {isExpanded && (
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-brand-orange text-white">
                <th className="p-3 text-left font-semibold border border-border-light">Day</th>
                <th className="p-3 text-center font-semibold border border-border-light">Morning</th>
                <th className="p-3 text-center font-semibold border border-border-light">Afternoon</th>
                <th className="p-3 text-center font-semibold border border-border-light">Night</th>
              </tr>
              {/* Rate Row */}
              <tr className="bg-brand-amber/20">
                <td className="p-3 text-left font-semibold text-text-primary border border-border-light">Rate</td>
                <td className="p-2 text-center border border-border-light">
                  <input
                    type="number"
                    value={editingRate === `${weekKey}-morning` ? tempRate : rates[currentWeek]?.morning || ''}
                    onChange={(e) => setTempRate(e.target.value)}
                    onFocus={() => handleRateClick('morning')}
                    onBlur={() => handleRateBlur('morning')}
                    placeholder="0"
                    className="w-full text-center p-1 border rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </td>
                <td className="p-2 text-center border border-border-light">
                  <input
                    type="number"
                    value={editingRate === `${weekKey}-Afternoon` ? tempRate : rates[currentWeek]?.Afternoon || ''}
                    onChange={(e) => setTempRate(e.target.value)}
                    onFocus={() => handleRateClick('Afternoon')}
                    onBlur={() => handleRateBlur('Afternoon')}
                    placeholder="0"
                    className="w-full text-center p-1 border rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </td>
                <td className="p-2 text-center border border-border-light">
                  <input
                    type="number"
                    value={editingRate === `${weekKey}-night` ? tempRate : rates[currentWeek]?.night || ''}
                    onChange={(e) => setTempRate(e.target.value)}
                    onFocus={() => handleRateClick('night')}
                    onBlur={() => handleRateBlur('night')}
                    placeholder="0"
                    className="w-full text-center p-1 border rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </td>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, idx) => (
                <tr key={day} className={idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-surface'}>
                  <td className="p-3 font-semibold text-text-primary border border-border-light">
                    {formatDayName(day)}
                  </td>
                  {MEAL_TIMES.map((mealTime) => {
                    const value = getMealValue(day, mealTime);
                    const isEdit = isEditing(day, mealTime);

                    return (
                      <td key={mealTime} className="p-2 text-center border border-border-light">
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="outline" className={`text-xs ${mealTimeColors[mealTime]}`}>
                            {mealTimeIcons[mealTime]}
                          </Badge>
                          <Input
                            type="text"
                            value={isEdit ? tempValue : value}
                            onChange={(e) => setTempValue(e.target.value)}
                            onFocus={() => handleCellClick(day, mealTime)}
                            onBlur={() => handleCellBlur(day, mealTime)}
                            placeholder="Add meal"
                            className="flex-1 text-center p-1 border rounded bg-transparent text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange text-sm"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Summary Section - Always visible */}
      <Card className="bg-gradient-to-br from-brand-orange/5 to-brand-amber/5 border-brand-orange/20">
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-bold text-text-primary mb-4">Summary for Week {currentWeek}</h3>
          
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-4 font-semibold text-text-primary border-b-2 border-border-light pb-2">
            <div>Meal Time</div>
            <div className="text-center">Total Count</div>
            <div className="text-center">Rate</div>
            <div className="text-center">Amount</div>
          </div>

          {/* Morning Row */}
          <div className="grid grid-cols-4 gap-4 items-center py-2 border-b border-border-light">
            <div className="font-medium text-brand-orange">Morning</div>
            <div className="text-center text-text-primary font-semibold">{calculateTotals().morningCount}</div>
            <div className="text-center text-text-primary">₹ {rates[currentWeek]?.morning || '0'}</div>
            <div className="text-center font-bold text-brand-green">₹ {calculateTotals().morningAmount.toFixed(2)}</div>
          </div>

          {/* Afternoon Row */}
          <div className="grid grid-cols-4 gap-4 items-center py-2 border-b border-border-light">
            <div className="font-medium text-brand-orange">Afternoon</div>
            <div className="text-center text-text-primary font-semibold">{calculateTotals().AfternoonCount}</div>
            <div className="text-center text-text-primary">₹ {rates[currentWeek]?.Afternoon || '0'}</div>
            <div className="text-center font-bold text-brand-green">₹ {calculateTotals().AfternoonAmount.toFixed(2)}</div>
          </div>

          {/* Night Row */}
          <div className="grid grid-cols-4 gap-4 items-center py-2 border-b-2 border-border-light pb-2">
            <div className="font-medium text-brand-orange">Night</div>
            <div className="text-center text-text-primary font-semibold">{calculateTotals().nightCount}</div>
            <div className="text-center text-text-primary">₹ {rates[currentWeek]?.night || '0'}</div>
            <div className="text-center font-bold text-brand-green">₹ {calculateTotals().nightAmount.toFixed(2)}</div>
          </div>

          {/* Grand Total Row */}
          <div className="grid grid-cols-4 gap-4 items-center py-3 bg-brand-orange/10 rounded-lg px-3 font-bold text-lg">
            <div className="text-brand-orange">Grand Total</div>
            <div className="text-center text-text-primary">
              {calculateTotals().morningCount + calculateTotals().AfternoonCount + calculateTotals().nightCount}
            </div>
            <div></div>
            <div className="text-center text-brand-orange">
              ₹ {(calculateTotals().morningAmount + calculateTotals().AfternoonAmount + calculateTotals().nightAmount).toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Save to Database Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSaveToDatabase}
          disabled={isSaving}
          className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-6 text-lg font-semibold shadow-lg"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Saving...' : 'Save to Database'}
        </Button>
      </div>
    </div>
  );
}
