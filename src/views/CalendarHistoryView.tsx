import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Video,
} from 'lucide-react';
import { StudyDataState } from '../hooks/useStudyData';
import {
  getTodayKey,
  formatFriendlyDate,
  formatDateKey,
  getPreviousDayKey,
} from '../utils/dates';

interface CalendarHistoryViewProps {
  data: StudyDataState;
  onNavigateToToday: () => void;
}

export const CalendarHistoryView: React.FC<CalendarHistoryViewProps> = ({
  data,
  onNavigateToToday,
}) => {
  const todayKey = getTodayKey();
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]));

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Compute calendar days for the current month grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday-based start of calendar
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const calendarCells = [];
  // Leading empty cells
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    calendarCells.push(formatDateKey(cellDate));
  }

  // Selected date tasks
  const selectedTasks = data.allTasks
    .filter((t) => t.dateKey === selectedDateKey)
    .sort((a, b) => a.order - b.order);

  const completedCount = selectedTasks.filter((t) => t.done).length;
  const totalCount = selectedTasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Monthly stats
  const tasksThisMonth = data.allTasks.filter((t) => {
    const [y, m] = t.dateKey.split('-').map(Number);
    return y === year && m === month + 1;
  });
  const completedThisMonth = tasksThisMonth.filter((t) => t.done).length;
  const monthRate = tasksThisMonth.length > 0 ? Math.round((completedThisMonth / tasksThisMonth.length) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header with Monthly Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-violet-400" />
            <span>Study Calendar & Historical Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse past study days, verify completed lectures, and inspect historical consistency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToToday}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-violet-400" />
            <span>Jump to Today</span>
          </button>
        </div>
      </div>

      {/* Monthly Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-xs text-slate-400">Month Tasks Completed</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {completedThisMonth} <span className="text-xs font-normal text-slate-500">/ {tasksThisMonth.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-xs text-slate-400">Monthly Completion Rate</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {monthRate}%
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-xs text-slate-400">Current Study Streak</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {data.currentStreak} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid & Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Month Calendar */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl">
          {/* Month Header Nav */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <h3 className="text-base font-bold text-white font-sans">{monthName}</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2 font-mono">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((dateKey, idx) => {
              if (!dateKey) {
                return <div key={`empty-${idx}`} className="h-16 rounded-lg opacity-10" />;
              }

              const dayTasks = data.allTasks.filter((t) => t.dateKey === dateKey);
              const done = dayTasks.filter((t) => t.done).length;
              const total = dayTasks.length;
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDateKey;
              const dayNum = dateKey.split('-')[2];

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDateKey(dateKey)}
                  className={`h-16 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-violet-500 bg-violet-950/40 shadow-md ring-1 ring-violet-500/50'
                      : isToday
                      ? 'border-violet-500/50 bg-slate-900 shadow-xs'
                      : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday ? 'text-violet-400' : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    )}
                  </div>

                  {total > 0 ? (
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span
                        className={
                          done === total
                            ? 'text-emerald-400 font-bold'
                            : done > 0
                            ? 'text-amber-400'
                            : 'text-slate-500'
                        }
                      >
                        {done}/{total}
                      </span>
                      {done === total && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-700 font-mono">—</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Date Historical Detail */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl flex flex-col">
          <div className="pb-3 border-b border-slate-800 mb-4">
            <h4 className="text-sm font-bold text-white">
              {formatFriendlyDate(selectedDateKey)}
            </h4>
            <div className="text-[11px] text-violet-300 font-sans mt-0.5 flex items-center gap-1">
              <Video className="w-3 h-3 text-violet-400" />
              <span>Recorded classes for {formatFriendlyDate(getPreviousDayKey(selectedDateKey))}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
              <span>{completedCount} of {totalCount} completed</span>
              <span>·</span>
              <span className={percentage === 100 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {percentage}%
              </span>
            </div>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[420px]">
            {selectedTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <Sparkles className="w-6 h-6 text-slate-600 mx-auto mb-2 opacity-50" />
                <span>No study records logged for this date.</span>
              </div>
            ) : (
              selectedTasks.map((task) => {
                const sub = subjectMap.get(task.subjectId);
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border text-xs ${
                      task.done
                        ? 'bg-slate-950/60 border-slate-800/60'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-medium ${
                          task.done ? 'text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          task.done
                            ? 'text-emerald-400 bg-emerald-950/50'
                            : 'text-slate-500 bg-slate-900'
                        }`}
                      >
                        {task.done ? 'Done' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      {sub && <span>{sub.name}</span>}
                      <span>·</span>
                      <span className="uppercase">{task.type}</span>
                      {task.completedAt && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
