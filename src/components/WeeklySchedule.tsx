import { useState } from 'react';
import { FileDown, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store';
import { DAYS, MEAL_TIMES, formatDayName, formatMealTime, getMealValue } from '@/utils';
import { generatePDF } from '@/utils/pdfGenerator';
import type { DayOfWeek, MealTime } from '@/types';

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

export function WeeklySchedule() {
  const { selectedCompanyId, companies, schedules, updateMeal } = useStore();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const schedule = selectedCompanyId ? schedules[selectedCompanyId] : undefined;

  const handleCellClick = (day: DayOfWeek, mealTime: MealTime) => {
    const cellId = `${day}-${mealTime}`;
    setEditingCell(cellId);
    setTempValue(getMealValue(schedule, day, mealTime));
  };

  const handleCellBlur = (day: DayOfWeek, mealTime: MealTime) => {
    if (selectedCompanyId) {
      updateMeal(selectedCompanyId, day, mealTime, tempValue);
    }
    setEditingCell(null);
  };

  const handleDownloadPDF = async () => {
    if (selectedCompany) {
      await generatePDF(selectedCompany.name, schedule);
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
      {/* Header with gradient */}
      <div className="relative p-3 sm:p-6 border-b border-border-light bg-gradient-to-br from-brand-orange/10 via-brand-amber/5 to-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-orange/10 border-2 border-brand-orange/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-text-primary truncate">{selectedCompany.name}</h1>
                <p className="text-xs sm:text-sm text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  Weekly Schedule
                </p>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <Button 
              onClick={handleDownloadPDF} 
              className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange/90 shadow-sm text-sm"
            >
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-6">
        <div className="min-w-max">
          {/* Mobile View - Stacked Cards */}
          <div className="sm:hidden space-y-4">
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="bg-bg-surface rounded-lg border border-border-light overflow-hidden">
                {/* Day Header */}
                <div className="bg-gradient-to-r from-brand-orange/10 to-transparent px-4 py-3 border-b border-border-light">
                  <p className="text-base font-bold text-text-primary">{formatDayName(day)}</p>
                  <p className="text-xs text-text-secondary">Day {dayIndex + 1}</p>
                </div>

                {/* Meals Grid */}
                <div className="grid grid-cols-1 divide-y divide-border-light">
                  {MEAL_TIMES.map((mealTime) => {
                    const cellId = `${day}-${mealTime}`;
                    const isEditing = editingCell === cellId;
                    const value = getMealValue(schedule, day, mealTime);

                    return (
                      <div key={mealTime} className="p-3 flex items-center gap-3">
                        <div className="flex-shrink-0 w-16">
                          <Badge 
                            variant="outline" 
                            className={`w-full justify-center text-xs ${mealTimeColors[mealTime]}`}
                          >
                            <span className="mr-1">{mealTimeIcons[mealTime]}</span>
                            {formatMealTime(mealTime)}
                          </Badge>
                        </div>
                        <div className="flex-1 relative">
                          {isEditing ? (
                            <Input
                              autoFocus
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => handleCellBlur(day, mealTime)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCellBlur(day, mealTime);
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              className="h-10 border rounded-lg bg-white text-sm"
                              placeholder="Enter meal..."
                            />
                          ) : (
                            <div
                              className="p-2 rounded-lg border border-dashed border-border-light cursor-pointer hover:bg-muted/50 transition-colors min-h-10 flex items-center"
                              onClick={() => handleCellClick(day, mealTime)}
                            >
                              {value ? (
                                <p className="text-sm font-medium text-text-primary line-clamp-1">{value}</p>
                              ) : (
                                <p className="text-xs text-text-secondary italic">+ Add meal</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table Grid */}
          <div className="hidden sm:block">
            {/* Meal Time Headers */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="col-span-1" />
              {MEAL_TIMES.map((mealTime) => (
                <div key={mealTime} className="flex items-center justify-center">
                  <Badge 
                    variant="outline" 
                    className={`px-4 py-2 text-sm font-semibold ${mealTimeColors[mealTime]} shadow-sm`}
                  >
                    <span className="mr-2">{mealTimeIcons[mealTime]}</span>
                    {formatMealTime(mealTime)}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="space-y-4">
              {DAYS.map((day, dayIndex) => (
                <div 
                  key={day} 
                  className="grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${dayIndex * 50}ms` }}
                >
                  {/* Day Label */}
                  <div className="flex items-center">
                    <div className="w-full bg-gradient-to-r from-brand-orange/10 to-transparent rounded-lg p-4 border-l-4 border-brand-orange">
                      <p className="text-lg font-bold text-text-primary">{formatDayName(day)}</p>
                      <p className="text-xs text-text-secondary mt-0.5">Day {dayIndex + 1}</p>
                    </div>
                  </div>

                  {/* Meal Cells */}
                  {MEAL_TIMES.map((mealTime) => {
                    const cellId = `${day}-${mealTime}`;
                    const isEditing = editingCell === cellId;
                    const value = getMealValue(schedule, day, mealTime);

                    return (
                      <div key={mealTime} className="relative group">
                        <div className={`h-full rounded-lg border-2 transition-all duration-200 ${
                          isEditing 
                            ? 'border-brand-orange shadow-lg shadow-brand-orange/20 scale-105' 
                            : value 
                              ? 'border-border-light bg-bg-surface hover:border-brand-orange/40 hover:shadow-md' 
                              : 'border-dashed border-border-light bg-muted/30 hover:bg-muted/50 hover:border-brand-orange/40'
                        }`}>
                          {isEditing ? (
                            <Input
                              autoFocus
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onBlur={() => handleCellBlur(day, mealTime)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCellBlur(day, mealTime);
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              className="h-full border-0 rounded-lg bg-white shadow-inner text-base"
                              placeholder="Enter food name..."
                            />
                          ) : (
                            <div
                              className="h-full min-h-[80px] px-4 py-3 flex items-center cursor-pointer"
                              onClick={() => handleCellClick(day, mealTime)}
                            >
                              {value ? (
                                <div className="w-full">
                                  <p className="text-text-primary font-medium line-clamp-2">{value}</p>
                                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-brand-orange">Click to edit</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full text-center">
                                  <p className="text-text-secondary text-sm italic">+ Add meal</p>
                                  <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-brand-orange">Click to add</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Corner accent */}
                        {value && !isEditing && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-brand-green shadow-sm" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-brand-orange/10 to-transparent rounded-lg p-3 sm:p-4 border border-brand-orange/20">
              <p className="text-xs sm:text-sm text-text-secondary mb-1">Total Meals</p>
              <p className="text-xl sm:text-2xl font-bold text-brand-orange">
                {schedule?.meals.length || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-brand-green/10 to-transparent rounded-lg p-3 sm:p-4 border border-brand-green/20">
              <p className="text-xs sm:text-sm text-text-secondary mb-1">Days Planned</p>
              <p className="text-xl sm:text-2xl font-bold text-brand-green">
                {schedule ? new Set(schedule.meals.map(m => m.day)).size : 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-brand-amber/10 to-transparent rounded-lg p-3 sm:p-4 border border-brand-amber/20 col-span-2 sm:col-span-1">
              <p className="text-xs sm:text-sm text-text-secondary mb-1">Completion</p>
              <p className="text-xl sm:text-2xl font-bold text-brand-amber">
                {schedule ? Math.round((schedule.meals.length / (DAYS.length * MEAL_TIMES.length)) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}