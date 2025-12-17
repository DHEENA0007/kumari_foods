import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store';
import type { DateBasedMealEntry } from '@/types';

interface MealScheduleTableProps {
  companyId: string;
  month: string; // Format: "May 2025"
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Convert YYYY-MM-DD to DD-MM-YYYY
const formatDateToDDMMYYYY = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
};

export function MealScheduleTable({ companyId, month }: MealScheduleTableProps) {
  const { getMealSchedule, addMealSchedule, updateMealSchedule, updateMealScheduleRates } = useStore();
  const [currentMonth, setCurrentMonth] = useState(month);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showAddMonth, setShowAddMonth] = useState(false);
  const [newMonth, setNewMonth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const schedule = getMealSchedule(companyId, currentMonth);

  const handleRateClick = (mealType: 'tiffen' | 'lunch' | 'dinner') => {
    setEditingRate(mealType);
    setTempRate(schedule?.rates?.[mealType]?.toString() || '');
  };

  const handleRateBlur = async (mealType: 'tiffen' | 'lunch' | 'dinner') => {
    if (!schedule) return;
    
    const rateValue = tempRate ? parseFloat(tempRate) : undefined;
    
    // Update rates using store method
    const updatedRates = {
      ...schedule.rates,
      [mealType]: rateValue
    };
    
    await updateMealScheduleRates(companyId, currentMonth, updatedRates);
    
    // Clear editing state after save completes
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
    
    // Sum up all the numeric values
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

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      // Save to storage (which also syncs to MongoDB)
      const { saveToStorage } = useStore.getState();
      await saveToStorage();
      
      // Collapse after successful save
      setIsExpanded(false);
      
      alert('✓ Schedule saved to database successfully!');
    } catch (error) {
      console.error('Failed to save to database:', error);
      alert('✗ Failed to save to database. Please try again.');
    } finally {
      setIsSaving(false);
    }
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

    updateMealSchedule(companyId, currentMonth, updatedEntries);
    setEditingCell(null);
  };

  const handlePrevMonth = () => {
    const [monthName, year] = currentMonth.split(' ');
    const monthIndex = MONTHS.indexOf(monthName);
    let newMonth = monthIndex - 1;
    let newYear = parseInt(year);

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setCurrentMonth(`${MONTHS[newMonth]} ${newYear}`);
  };

  const handleNextMonth = () => {
    const [monthName, year] = currentMonth.split(' ');
    const monthIndex = MONTHS.indexOf(monthName);
    let newMonth = monthIndex + 1;
    let newYear = parseInt(year);

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setCurrentMonth(`${MONTHS[newMonth]} ${newYear}`);
  };

  const handleAddMonth = () => {
    if (newMonth.trim()) {
      addMealSchedule(companyId, {
        companyId,
        month: newMonth.trim(),
        entries: []
      });
      setCurrentMonth(newMonth.trim());
      setNewMonth('');
      setShowAddMonth(false);
    }
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
      updateMealSchedule(companyId, currentMonth, updated);
      setShowDatePicker(false);
      setSelectedDate('');
    }
  };

  const sampleDates = schedule?.entries.map(e => e.date) || [];

  const isEditing = (date: string, mealType: string) => {
    return editingCell === `${date}-${mealType}`;
  };

  const getValue = (date: string, mealType: 'tiffen' | 'lunch' | 'dinner') => {
    const entry = schedule?.entries.find(e => e.date === date);
    return entry?.[mealType]?.toString() || '-';
  };

  if (!schedule) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-text-secondary">No schedule found for {currentMonth}</p>
        <Button onClick={() => setShowAddMonth(true)} className="bg-brand-orange hover:bg-brand-orange/90">
          <Plus className="w-4 h-4 mr-2" />
          Add {currentMonth} Schedule
        </Button>

        {showAddMonth && (
          <div className="p-4 border border-border-light rounded-lg mt-4">
            <Input
              value={newMonth}
              onChange={(e) => setNewMonth(e.target.value)}
              placeholder="Enter month (e.g., May 2025)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMonth();
              }}
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={handleAddMonth} className="bg-brand-orange hover:bg-brand-orange/90">
                Add
              </Button>
              <Button variant="outline" onClick={() => setShowAddMonth(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation with Expand/Collapse */}
      <div className="flex items-center justify-between bg-bg-surface p-4 rounded-lg border border-border-light">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold text-text-primary flex-1 text-center">{currentMonth}</h2>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
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
              <th className="p-3 text-left font-semibold border border-border-light">Date</th>
              <th className="p-3 text-center font-semibold border border-border-light">Tiffen</th>
              <th className="p-3 text-center font-semibold border border-border-light">Lunch</th>
              <th className="p-3 text-center font-semibold border border-border-light">Dinner</th>
              <th className="p-3 text-center font-semibold border border-border-light w-12">Action</th>
            </tr>
            {/* Rate Row */}
            {sampleDates.length > 0 && (
              <tr className="bg-brand-amber/20">
                <td className="p-3 text-left font-semibold text-text-primary border border-border-light">Rate</td>
                <td className="p-2 text-center border border-border-light">
                  <input
                    type="number"
                    value={editingRate === 'tiffen' ? tempRate : schedule?.rates?.tiffen || ''}
                    onChange={(e) => setTempRate(e.target.value)}
                    onFocus={() => handleRateClick('tiffen')}
                    onBlur={() => handleRateBlur('tiffen')}
                    placeholder="0"
                    className="w-full text-center p-1 border rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </td>
                <td className="p-2 text-center border border-border-light">
                  <input
                    type="number"
                    value={editingRate === 'lunch' ? tempRate : schedule?.rates?.lunch || ''}
                    onChange={(e) => setTempRate(e.target.value)}
                    onFocus={() => handleRateClick('lunch')}
                    onBlur={() => handleRateBlur('lunch')}
                    placeholder="0"
                    className="w-full text-center p-1 border rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </td>
                <td className="p-2 text-center border border-border-light">
                  <input
                    type="number"
                    value={editingRate === 'dinner' ? tempRate : schedule?.rates?.dinner || ''}
                    onChange={(e) => setTempRate(e.target.value)}
                    onFocus={() => handleRateClick('dinner')}
                    onBlur={() => handleRateBlur('dinner')}
                    placeholder="0"
                    className="w-full text-center p-1 border rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </td>
                <td className="p-2 text-center border border-border-light"></td>
              </tr>
            )}
          </thead>
          <tbody>
            {sampleDates.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-text-secondary">
                  <div className="space-y-3">
                    <p>No entries yet. Add dates and values to create the schedule.</p>
                    <div className="flex flex-col gap-2 items-center">
                      {!showDatePicker ? (
                        <Button onClick={handleAddDate} className="bg-brand-orange hover:bg-brand-orange/90">
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Date
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-bg-surface rounded-lg border border-border-light">
                          <label className="text-sm font-medium text-text-primary">Pick Date:</label>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            autoFocus
                            className="px-3 py-1 border rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                          />
                          <Button
                            onClick={() => handleDateSelected(selectedDate)}
                            disabled={!selectedDate}
                            className="bg-brand-orange hover:bg-brand-orange/90"
                          >
                            Add
                          </Button>
                          <Button
                            onClick={() => {
                              setShowDatePicker(false);
                              setSelectedDate('');
                            }}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sampleDates.map((date, idx) => (
                <tr key={date} className={idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-surface'}>
                  <td className="p-3 font-mono font-semibold text-text-primary border border-border-light">
                    {date}
                  </td>
                  <td className="p-2 text-center border border-border-light">
                    <input
                      type="text"
                      value={isEditing(date, 'tiffen') ? tempValue : getValue(date, 'tiffen')}
                      onChange={(e) => setTempValue(e.target.value)}
                      onFocus={() => handleCellClick(date, 'tiffen')}
                      onBlur={() => handleCellBlur(date, 'tiffen')}
                      className="w-full text-center p-1 border rounded bg-transparent text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </td>
                  <td className="p-2 text-center border border-border-light">
                    <input
                      type="text"
                      value={isEditing(date, 'lunch') ? tempValue : getValue(date, 'lunch')}
                      onChange={(e) => setTempValue(e.target.value)}
                      onFocus={() => handleCellClick(date, 'lunch')}
                      onBlur={() => handleCellBlur(date, 'lunch')}
                      className="w-full text-center p-1 border rounded bg-transparent text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </td>
                  <td className="p-2 text-center border border-border-light">
                    <input
                      type="text"
                      value={isEditing(date, 'dinner') ? tempValue : getValue(date, 'dinner')}
                      onChange={(e) => setTempValue(e.target.value)}
                      onFocus={() => handleCellClick(date, 'dinner')}
                      onBlur={() => handleCellBlur(date, 'dinner')}
                      className="w-full text-center p-1 border rounded bg-transparent text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                    />
                  </td>
                  <td className="p-2 text-center border border-border-light">
                    <button
                      onClick={() => {
                        const updated = schedule.entries.filter(e => e.date !== date);
                        updateMealSchedule(companyId, currentMonth, updated);
                      }}
                      className="text-destructive hover:text-destructive/80 text-sm font-medium"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
      )}

      {/* Summary Section - Always visible */}
      {sampleDates.length > 0 && (
        <Card className="bg-gradient-to-br from-brand-orange/5 to-brand-amber/5 border-brand-orange/20">
          <div className="p-4 space-y-3">
            <h3 className="text-lg font-bold text-text-primary mb-4">Summary for {currentMonth}</h3>
            
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-4 font-semibold text-text-primary border-b-2 border-border-light pb-2">
              <div>Meal Type</div>
              <div className="text-center">Total Count</div>
              <div className="text-center">Rate</div>
              <div className="text-center">Amount</div>
            </div>

            {/* Tiffen Row */}
            <div className="grid grid-cols-4 gap-4 items-center py-2 border-b border-border-light">
              <div className="font-medium text-brand-orange">Tiffen</div>
              <div className="text-center text-text-primary font-semibold">{calculateTotals().tiffenCount}</div>
              <div className="text-center text-text-primary">₹ {schedule?.rates?.tiffen || '0'}</div>
              <div className="text-center font-bold text-brand-green">₹ {calculateTotals().tiffenAmount.toFixed(2)}</div>
            </div>

            {/* Lunch Row */}
            <div className="grid grid-cols-4 gap-4 items-center py-2 border-b border-border-light">
              <div className="font-medium text-brand-orange">Lunch</div>
              <div className="text-center text-text-primary font-semibold">{calculateTotals().lunchCount}</div>
              <div className="text-center text-text-primary">₹ {schedule?.rates?.lunch || '0'}</div>
              <div className="text-center font-bold text-brand-green">₹ {calculateTotals().lunchAmount.toFixed(2)}</div>
            </div>

            {/* Dinner Row */}
            <div className="grid grid-cols-4 gap-4 items-center py-2 border-b-2 border-border-light pb-2">
              <div className="font-medium text-brand-orange">Dinner</div>
              <div className="text-center text-text-primary font-semibold">{calculateTotals().dinnerCount}</div>
              <div className="text-center text-text-primary">₹ {schedule?.rates?.dinner || '0'}</div>
              <div className="text-center font-bold text-brand-green">₹ {calculateTotals().dinnerAmount.toFixed(2)}</div>
            </div>

            {/* Grand Total Row */}
            <div className="grid grid-cols-4 gap-4 items-center py-3 bg-brand-orange/10 rounded-lg px-3 font-bold text-lg">
              <div className="text-brand-orange">Grand Total</div>
              <div className="text-center text-text-primary">
                {calculateTotals().tiffenCount + calculateTotals().lunchCount + calculateTotals().dinnerCount}
              </div>
              <div></div>
              <div className="text-center text-brand-orange">
                ₹ {(calculateTotals().tiffenAmount + calculateTotals().lunchAmount + calculateTotals().dinnerAmount).toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Save to Database Button */}
      {sampleDates.length > 0 && (
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
      )}

      {/* Action Buttons - Only show when expanded */}
      {isExpanded && (
      <div className="flex gap-2 flex-wrap">
        {sampleDates.length > 0 && (
          <>
            <Button
              onClick={handleAddDate}
              className="bg-brand-orange hover:bg-brand-orange/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Date
            </Button>

            {showDatePicker && (
              <div className="flex items-center gap-2 p-3 bg-bg-surface rounded-lg border border-border-light">
                <label className="text-sm font-medium text-text-primary">Pick Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1 border rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
                <Button
                  onClick={() => handleDateSelected(selectedDate)}
                  disabled={!selectedDate}
                  className="bg-brand-orange hover:bg-brand-orange/90"
                >
                  Add
                </Button>
                <Button
                  onClick={() => {
                    setShowDatePicker(false);
                    setSelectedDate('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}

        <Button
          onClick={() => setShowAddMonth(!showAddMonth)}
          className="flex-1 bg-brand-orange hover:bg-brand-orange/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Month
        </Button>
      </div>
      )}

      {/* Add Month Form - Only show when expanded */}
      {isExpanded && showAddMonth && (
        <div className="p-4 border border-border-light rounded-lg bg-bg-surface">
          <Input
            value={newMonth}
            onChange={(e) => setNewMonth(e.target.value)}
            placeholder="Enter month (e.g., June 2025)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddMonth();
            }}
          />
          <div className="flex gap-2 mt-2">
            <Button onClick={handleAddMonth} className="bg-brand-orange hover:bg-brand-orange/90">
              Add
            </Button>
            <Button variant="outline" onClick={() => setShowAddMonth(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
