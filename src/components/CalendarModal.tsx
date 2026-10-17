import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { StudyDataState } from '../hooks/useStudyData';
import { formatDateKey, getTodayKey, formatFriendlyDate } from '../utils/dates';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StudyDataState;
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  data,
  selectedDateKey,
  onSelectDate,
}) => {
  const todayKey = getTodayKey();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  if (!isOpen) return null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday-based (0 = Mon, 6 = Sun)
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();

  const cells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push(formatDateKey(new Date(year, month, d)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-slate-900 font-sans">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Study Calendar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-900">{monthName}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-1.5 font-mono">
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
          <span>Su</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((dateKey, idx) => {
            if (!dateKey) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }

            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDateKey;
            const dayNum = dateKey.split('-')[2];

            const dayTasks = data.allTasks.filter((t) => t.dateKey === dateKey);
            const done = dayTasks.filter((t) => t.done).length;
            const total = dayTasks.length;
            const allDone = total > 0 && done === total;

            return (
              <button
                key={dateKey}
                onClick={() => {
                  onSelectDate(dateKey);
                  onClose();
                }}
                className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                    : isToday
                    ? 'border-slate-300 bg-slate-50 text-slate-900 font-semibold'
                    : 'border-transparent hover:border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-xs leading-none mt-0.5">{dayNum}</span>
                {total > 0 ? (
                  <span
                    className={`text-[9px] font-mono leading-none ${
                      allDone ? 'text-emerald-600 font-bold' : done > 0 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {done}/{total}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-300 leading-none">·</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={() => {
              onSelectDate(todayKey);
              onClose();
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            Jump to Today
          </button>
          <span>Selected: {formatFriendlyDate(selectedDateKey)}</span>
        </div>
      </div>
    </div>
  );
};
