import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit2,
  Sliders,
  Clock,
  BookOpen,
  FileText,
  X,
  Sparkles,
  Video,
  ArrowRight,
  Loader2,
  AlertCircle,
  Moon,
} from 'lucide-react';
import { StudyDataState } from '../hooks/useStudyData';
import { DaySchedule, WeeklyClassSlot } from '../types';
import {
  getWeekDaysForDate,
  formatFriendlyDate,
  parseDateKey,
  getPreviousDayKey,
  getDayOfWeekFromKey,
  WEEKDAY_NAMES,
} from '../utils/dates';

interface WeeklyPlannerRedesignViewProps {
  data: StudyDataState;
  onUpdateSlot: (dayOfWeek: number, slot: 1 | 2 | 3, subjectId: string | null) => Promise<void>;
  onSaveScheduleDay?: (daySchedule: DaySchedule) => Promise<{ success: boolean; message?: string }>;
  onToggleTask: (taskId: string) => Promise<{ success: boolean; message?: string }>;
  onSelectDate: (dateKey: string) => void;
}

export const WeeklyPlannerRedesignView: React.FC<WeeklyPlannerRedesignViewProps> = ({
  data,
  onUpdateSlot,
  onSaveScheduleDay,
  onToggleTask,
  onSelectDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string>('');

  // Weekly Timetable Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDayOfWeek, setEditingDayOfWeek] = useState<number>(1); // 0=Sunday, 1=Monday...
  const [isRestDay, setIsRestDay] = useState<boolean>(false);
  const [draftClasses, setDraftClasses] = useState<WeeklyClassSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]));

  // Week navigation
  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const resetToThisWeek = () => {
    setCurrentDate(new Date());
  };

  // 7 Days of the active week (Monday through Sunday)
  const weekDays = getWeekDaysForDate(currentDate);

  // Set default selected day to today or Monday
  useEffect(() => {
    const today = weekDays.find((d) => d.isToday);
    if (today && !selectedDayKey) {
      setSelectedDayKey(today.dateKey);
    } else if (!selectedDayKey && weekDays[0]) {
      setSelectedDayKey(weekDays[0].dateKey);
    }
  }, [weekDays, selectedDayKey]);

  // Open editor pre-populated for a specific weekday
  const openEditorForDay = (dayOfWeek: number) => {
    setEditingDayOfWeek(dayOfWeek);
    const day = data.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
    if (day) {
      const isRest = day.isRestDay || day.classes.every((c) => !c.subjectId);
      setIsRestDay(isRest);
      setDraftClasses(day.classes.map((c) => ({ ...c })));
    } else {
      setIsRestDay(false);
      setDraftClasses([
        { slot: 1, subjectId: null },
        { slot: 2, subjectId: null },
        { slot: 3, subjectId: null },
      ]);
    }
    setSaveSuccess(false);
    setSaveError(null);
    setIsEditorOpen(true);
  };

  // Sync draft when editingDayOfWeek changes inside open modal
  useEffect(() => {
    if (isEditorOpen) {
      const day = data.weeklySchedule.find((s) => s.dayOfWeek === editingDayOfWeek);
      if (day) {
        const isRest = day.isRestDay || day.classes.every((c) => !c.subjectId);
        setIsRestDay(isRest);
        setDraftClasses(day.classes.map((c) => ({ ...c })));
      } else {
        setIsRestDay(false);
        setDraftClasses([
          { slot: 1, subjectId: null },
          { slot: 2, subjectId: null },
          { slot: 3, subjectId: null },
        ]);
      }
      setSaveSuccess(false);
      setSaveError(null);
    }
  }, [editingDayOfWeek, isEditorOpen, data.weeklySchedule]);

  const handleSlotChange = (slot: 1 | 2 | 3, subjectId: string | null) => {
    setSaveSuccess(false);
    setSaveError(null);
    setDraftClasses((curr) =>
      curr.map((c) => (c.slot === slot ? { ...c, subjectId } : c))
    );
  };

  const handleToggleRestDay = (checked: boolean) => {
    setIsRestDay(checked);
    setSaveSuccess(false);
    setSaveError(null);
    if (checked) {
      setDraftClasses((curr) => curr.map((c) => ({ ...c, subjectId: null })));
    }
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const activeDay = data.weeklySchedule.find((s) => s.dayOfWeek === editingDayOfWeek);
      const dayName = activeDay ? activeDay.dayName : WEEKDAY_NAMES[editingDayOfWeek];
      const effectiveRestDay = isRestDay || draftClasses.every((c) => !c.subjectId);

      const scheduleToSave: DaySchedule = {
        dayOfWeek: editingDayOfWeek,
        dayName,
        isRestDay: effectiveRestDay,
        classes: [1, 2, 3].map((slotNum) => {
          const match = draftClasses.find((c) => c.slot === slotNum);
          return {
            slot: slotNum as 1 | 2 | 3,
            subjectId: effectiveRestDay ? null : (match?.subjectId || null),
          };
        }),
      };

      // 2. Persist changes to database & await transaction
      if (onSaveScheduleDay) {
        const res = await onSaveScheduleDay(scheduleToSave);
        if (!res.success) {
          throw new Error(res.message || 'Failed to save schedule to database.');
        }
      } else {
        for (const cls of scheduleToSave.classes) {
          await onUpdateSlot(editingDayOfWeek, cls.slot, cls.subjectId);
        }
      }

      // 3. Show clear "Saved" indicator
      setSaveSuccess(true);
    } catch (err: unknown) {
      console.error('Save schedule error:', err);
      const msg = err instanceof Error ? err.message : 'Database transaction failed.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>Weekly Planner & Recorded Class Mapping</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-slate-500">
              Recorded lectures watched the day after original class date.
            </p>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 inline-flex items-center gap-1">
              <Video className="w-3 h-3 text-blue-600" />
              <span>1-day calendar offset active</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Weekly Timetable Button */}
          <button
            onClick={() => openEditorForDay(1)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Weekly Timetable</span>
          </button>

          <div className="flex items-center gap-1 border border-slate-200 rounded-xl bg-white p-0.5">
            <button
              onClick={prevWeek}
              className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={resetToThisWeek}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              This Week
            </button>

            <button
              onClick={nextWeek}
              className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7 Days Schedule Cards (Monday through Sunday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weekDays.map((wd) => {
          // Recorded lecture mapping: The study tasks on wd.dateKey correspond to original class date 1 day prior
          const origDateKey = getPreviousDayKey(wd.dateKey);
          const origDayOfWeek = getDayOfWeekFromKey(origDateKey);
          const schedule = data.weeklySchedule.find((s) => s.dayOfWeek === origDayOfWeek);

          const isToday = wd.isToday;
          const isSelected = wd.dateKey === selectedDayKey;

          // Assigned classes from the mapped original schedule
          const assignedClasses = schedule?.classes.filter((c) => !!c.subjectId) || [];
          const isScheduleRest = !!schedule?.isRestDay;
          const hasNoClasses = isScheduleRest || assignedClasses.length === 0;

          // Tasks for this study date
          const dayTasks = data.allTasks.filter((t) => t.dateKey === wd.dateKey);
          const doneCount = dayTasks.filter((t) => t.done).length;
          const totalCount = dayTasks.length;
          const isAllDone = totalCount > 0 && doneCount === totalCount;
          const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

          // Study date formatting (prominent)
          const dateObj = parseDateKey(wd.dateKey);
          const studyFriendly = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          // Original class date formatting (muted underneath)
          const origDateObj = parseDateKey(origDateKey);
          const origFriendly = origDateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          return (
            <div
              key={wd.dateKey}
              onClick={() => setSelectedDayKey(wd.dateKey)}
              className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-300/70 shadow-sm'
                  : isToday
                  ? 'border-blue-300 ring-1 ring-blue-200'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Day Header with Study Date prominent and Original Class Date underneath */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
                  <div>
                    {/* Actual study day & date prominently */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">{wd.dayName}</span>
                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          Today
                        </span>
                      )}
                      {/* Clear No-classes or Rest day indicators in header */}
                      {isScheduleRest ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                          Rest day
                        </span>
                      ) : hasNoClasses ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          No classes
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 font-sans mt-0.5">
                      {studyFriendly}
                    </div>

                    {/* Original class date in smaller, muted text directly underneath */}
                    <div className="text-[11px] text-slate-500 font-sans mt-1 flex items-center gap-1">
                      <Video className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Recorded classes for {origFriendly}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open timetable editor for the original class date
                      openEditorForDay(origDayOfWeek);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    title={`Edit ${schedule?.dayName || 'Class'} timetable`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Content */}
                {hasNoClasses ? (
                  /* If no classes are scheduled, display clear 'No recorded classes scheduled' message */
                  <div className="py-7 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-1.5 my-1">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-1">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">No recorded classes scheduled</div>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      {isScheduleRest
                        ? 'Enjoy your rest day or use this time for revision.'
                        : 'No lectures scheduled on original class date.'}
                    </p>
                  </div>
                ) : (
                  /* Render ONLY assigned classes. Do NOT show empty Class 1, 2, or 3 cards for unassigned slots */
                  <div className="space-y-3">
                    {assignedClasses.map((cls) => {
                      const sub = subjectMap.get(cls.subjectId!);
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
                            {sub?.name || 'Class'}
                          </div>

                          <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60">
                            {/* Separate Lecture Checkbox */}
                            <div className="flex items-center justify-between text-xs">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (lectureTask) onToggleTask(lectureTask.id);
                                }}
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

                            {/* Separate DPP Checkbox */}
                            <div className="flex items-center justify-between text-xs">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (dppTask) onToggleTask(dppTask.id);
                                }}
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
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Additional Custom/Revision Tasks for this day */}
                {dayTasks
                  .filter((t) => t.type === 'custom' || t.type === 'revision' || !t.classSlot)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="mt-2.5 p-2 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id);
                        }}
                        className="flex items-center gap-1.5 text-left group cursor-pointer min-w-0"
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[9px] transition-colors shrink-0 ${
                            task.done
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'border-slate-300 group-hover:border-slate-500 bg-white'
                          }`}
                        >
                          {task.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span
                          className={`text-[11px] font-medium truncate ${
                            task.done ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </span>
                      </button>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 capitalize">
                        {task.type}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Day Card Footer */}
              <div className="pt-3.5 mt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[11px] font-mono text-slate-500">
                    {totalCount > 0
                      ? `${doneCount}/${totalCount} tasks done`
                      : isScheduleRest
                      ? 'Rest day'
                      : 'No classes scheduled'}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(wd.dateKey);
                  }}
                  className="w-full py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Open {wd.dayName.slice(0, 3)} Tasks</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Day Timetable Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-slate-900 font-sans">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Weekly Timetable
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recorded lecture mapping notice */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 mb-4 flex items-start gap-2">
              <Video className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Recorded Lecture Mapping</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Classes scheduled for <span className="font-bold underline">{WEEKDAY_NAMES[editingDayOfWeek]}</span> are watched as recorded lectures on <span className="font-bold underline">{WEEKDAY_NAMES[(editingDayOfWeek + 1) % 7]}</span>.
                </p>
              </div>
            </div>

            {/* Error banner if save fails */}
            {saveError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Day Selector Tabs (Monday through Sunday) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4">
              {data.weeklySchedule.map((day) => {
                const isSelected = day.dayOfWeek === editingDayOfWeek;
                return (
                  <button
                    key={day.dayOfWeek}
                    onClick={() => setEditingDayOfWeek(day.dayOfWeek)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {day.dayName.slice(0, 3)}
                  </button>
                );
              })}
            </div>

            {/* Rest Day / No Classes Toggle */}
            <div className="mb-4 p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Rest Day / No Scheduled Classes</div>
                  <div className="text-[11px] text-slate-500 font-sans">
                    Mark {WEEKDAY_NAMES[editingDayOfWeek]} as a break day without mandatory classes
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRestDay}
                  onChange={(e) => handleToggleRestDay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Class Slots */}
            {isRestDay ? (
              <div className="p-6 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 text-center text-xs text-amber-800">
                <Moon className="w-6 h-6 text-amber-500 mx-auto mb-1.5 opacity-80" />
                <div className="font-bold">{WEEKDAY_NAMES[editingDayOfWeek]} is marked as a Rest Day</div>
                <div className="text-[11px] text-amber-700/80 mt-0.5">
                  No mandatory Lecture or DPP tasks will be generated.
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    {WEEKDAY_NAMES[editingDayOfWeek]} Classes
                  </h4>
                  <span className="text-xs text-slate-400 font-sans">3 daily slots</span>
                </div>

                {[1, 2, 3].map((slotNum) => {
                  const slotConfig = draftClasses.find((c) => c.slot === slotNum);
                  const currentSubId = slotConfig?.subjectId || 'none';

                  return (
                    <div key={slotNum} className="space-y-1 text-xs">
                      <label className="block font-semibold text-slate-700">
                        Class {slotNum}
                      </label>
                      <select
                        value={currentSubId}
                        onChange={(e) => {
                          const val = e.target.value === 'none' ? null : e.target.value;
                          handleSlotChange(slotNum as 1 | 2 | 3, val);
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
                  );
                })}
              </div>
            )}

            {/* Modal Footer with Save Schedule button and Saved indicator */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Saved to database
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveSchedule}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
