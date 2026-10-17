import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit2,
  Clock,
  BookOpen,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import { StudyDataState } from '../hooks/useStudyData';
import { DaySchedule } from '../types';
import {
  getTodayKey,
  getWeekDaysForDate,
  formatFriendlyDate,
} from '../utils/dates';

interface WeeklyPlannerRedesignViewProps {
  data: StudyDataState;
  onUpdateSlot: (dayOfWeek: number, slot: 1 | 2 | 3, subjectId: string | null) => Promise<void>;
  onToggleTask: (taskId: string) => Promise<{ success: boolean; message?: string }>;
  onSelectDate: (dateKey: string) => void;
}

export const WeeklyPlannerRedesignView: React.FC<WeeklyPlannerRedesignViewProps> = ({
  data,
  onUpdateSlot,
  onToggleTask,
  onSelectDate,
}) => {
  const todayKey = getTodayKey();
  const [currentWeekBaseDate, setCurrentWeekBaseDate] = useState<Date>(new Date());
  const [editingDay, setEditingDay] = useState<DaySchedule | null>(null);

  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]));

  // Weekdays (Monday through Sunday)
  const weekDays = getWeekDaysForDate(currentWeekBaseDate);

  const prevWeek = () => {
    const d = new Date(currentWeekBaseDate);
    d.setDate(d.getDate() - 7);
    setCurrentWeekBaseDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekBaseDate);
    d.setDate(d.getDate() + 7);
    setCurrentWeekBaseDate(d);
  };

  const resetToThisWeek = () => {
    setCurrentWeekBaseDate(new Date());
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Weekly Curriculum Planner</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full 7-day schedule with independent Lecture and DPP classes every day.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={resetToThisWeek}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Current Week
          </button>

          <button
            onClick={nextWeek}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Days Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weekDays.map((wd) => {
          const schedule = data.weeklySchedule.find((s) => s.dayOfWeek === wd.dayOfWeek);
          const isToday = wd.isToday;
          const dayTasks = data.allTasks.filter((t) => t.dateKey === wd.dateKey);
          const doneCount = dayTasks.filter((t) => t.done).length;
          const totalCount = dayTasks.length;
          const isAllDone = totalCount > 0 && doneCount === totalCount;
          const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

          return (
            <div
              key={wd.dateKey}
              className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${
                isToday
                  ? 'border-blue-400 ring-1 ring-blue-300/60 shadow-sm'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{wd.dayName}</span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-sans">
                      {formatFriendlyDate(wd.dateKey)}
                    </span>
                  </div>

                  {schedule && (
                    <button
                      onClick={() => setEditingDay(schedule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={`Edit ${wd.dayName} timetable`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Day Content: All days have 3 Class slots with Lecture & DPP */}
                <div className="space-y-3">
                  {schedule?.classes.map((cls) => {
                    const sub = cls.subjectId ? subjectMap.get(cls.subjectId) : null;
                    const lectureTask = dayTasks.find(
                      (t) => t.classSlot === cls.slot && t.type === 'lecture'
                    );
                    const dppTask = dayTasks.find(
                      (t) => t.classSlot === cls.slot && t.type === 'dpp'
                    );

                    return (
                      <div
                        key={cls.slot}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                            Class {cls.slot}
                          </span>
                          {sub && (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sub.color }}
                            />
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-900 truncate mb-2">
                          {sub ? sub.name : 'No class assigned'}
                        </div>

                        {sub && (
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60">
                            {/* Lecture Row */}
                            <div className="flex items-center justify-between text-xs">
                              <button
                                onClick={() => lectureTask && onToggleTask(lectureTask.id)}
                                className="flex items-center gap-1.5 text-left group cursor-pointer min-w-0"
                                title={lectureTask ? 'Toggle lecture completion' : undefined}
                              >
                                <span
                                  className={`w-4 h-4 rounded flex items-center justify-center border text-[9px] transition-colors shrink-0 ${
                                    lectureTask?.done
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-slate-300 group-hover:border-slate-500 bg-white'
                                  }`}
                                >
                                  {lectureTask?.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span
                                  className={`text-[11px] font-medium truncate ${
                                    lectureTask?.done
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-700 group-hover:text-slate-900'
                                  }`}
                                >
                                  Lecture
                                </span>
                              </button>
                              <span className="text-[10px] text-slate-400 font-sans shrink-0">~1 hr</span>
                            </div>

                            {/* DPP Row */}
                            <div className="flex items-center justify-between text-xs">
                              <button
                                onClick={() => dppTask && onToggleTask(dppTask.id)}
                                className="flex items-center gap-1.5 text-left group cursor-pointer min-w-0"
                                title={dppTask ? 'Toggle DPP completion' : undefined}
                              >
                                <span
                                  className={`w-4 h-4 rounded flex items-center justify-center border text-[9px] transition-colors shrink-0 ${
                                    dppTask?.done
                                      ? 'bg-purple-600 border-purple-600 text-white'
                                      : 'border-slate-300 group-hover:border-slate-500 bg-white'
                                  }`}
                                >
                                  {dppTask?.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </span>
                                <span
                                  className={`text-[11px] font-medium truncate ${
                                    dppTask?.done
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-700 group-hover:text-slate-900'
                                  }`}
                                >
                                  DPP {cls.slot}
                                </span>
                              </button>
                              <span className="text-[10px] text-slate-400 font-sans shrink-0">~30 min</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Card Footer */}
              <div className="pt-3.5 mt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[11px] font-mono text-slate-500">
                    {totalCount > 0 ? `${doneCount}/${totalCount} tasks done` : 'No tasks'}
                  </span>
                  {isAllDone && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> All Done
                    </span>
                  )}
                </div>

                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isAllDone ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <button
                  onClick={() => onSelectDate(wd.dateKey)}
                  className="w-full py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 text-center transition-colors cursor-pointer"
                >
                  Open {wd.dayName.slice(0, 3)} Tasks
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Day Timetable Modal */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-slate-900 font-sans">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit {editingDay.dayName} Timetable
              </h3>
              <button
                onClick={() => setEditingDay(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Each class slot automatically schedules both a Lecture and a Daily Practice Problem (DPP).
            </p>

            <div className="space-y-4">
              {editingDay.classes.map((cls) => (
                <div key={cls.slot} className="space-y-1 text-xs">
                  <label className="block font-medium text-slate-700">
                    Class {cls.slot} Subject
                  </label>
                  <select
                    value={cls.subjectId || 'none'}
                    onChange={async (e) => {
                      const val = e.target.value === 'none' ? null : e.target.value;
                      await onUpdateSlot(editingDay.dayOfWeek, cls.slot, val);
                      setEditingDay((curr) => {
                        if (!curr) return null;
                        return {
                          ...curr,
                          classes: curr.classes.map((c) =>
                            c.slot === cls.slot ? { ...c, subjectId: val } : c
                          ),
                        };
                      });
                    }}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="none">No class</option>
                    {data.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingDay(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
