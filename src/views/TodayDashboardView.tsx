import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Hourglass,
  ChevronDown,
  ChevronUp,
  Plus,
  BookOpen,
  FileText,
  Check,
  Lock,
  CalendarCheck,
  Sliders,
  X,
} from 'lucide-react';
import { StudyDataState } from '../hooks/useStudyData';
import { DailyTask, TaskType } from '../types';
import {
  getTodayKey,
  formatFriendlyDate,
  getWeekDaysForDate,
  addDays,
  getDaysOverdue,
  parseDateKey,
} from '../utils/dates';
import { SubjectIcon } from '../components/SubjectIcon';

interface TodayDashboardViewProps {
  data: StudyDataState;
  selectedDateKey: string;
  onSelectDateKey: (dateKey: string) => void;
  onToggleTask: (taskId: string) => Promise<{ success: boolean; message?: string }>;
  onAddTask: (task: {
    title: string;
    subjectId: string;
    type: TaskType;
    classSlot?: number;
    estimatedMinutes?: number;
    notes?: string;
    dateKey?: string;
  }) => Promise<void>;
  onOpenCalendar: () => void;
  onOpenScheduleEdit: () => void;
  onEnsureTasks?: (dateKey: string) => Promise<void>;
}

export const TodayDashboardView: React.FC<TodayDashboardViewProps> = ({
  data,
  selectedDateKey,
  onSelectDateKey,
  onToggleTask,
  onAddTask,
  onOpenCalendar,
  onOpenScheduleEdit,
  onEnsureTasks,
}) => {
  const todayKey = getTodayKey();
  const isSelectedToday = selectedDateKey === todayKey;
  const selectedDate = parseDateKey(selectedDateKey);

  React.useEffect(() => {
    if (selectedDateKey && onEnsureTasks) {
      onEnsureTasks(selectedDateKey);
    }
  }, [selectedDateKey, onEnsureTasks]);

  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]));

  // Backlog state
  const overdueTasks = data.overdueTasks;
  const hasBacklog = overdueTasks.length > 0;
  const isStrictLocked = isSelectedToday && data.isTodayLocked;
  const [backlogCollapsed, setBacklogCollapsed] = useState(false);

  // Collapsible class cards
  const [collapsedClasses, setCollapsedClasses] = useState<Record<number, boolean>>({});

  const toggleClassCollapse = (slot: number) => {
    setCollapsedClasses((prev) => ({ ...prev, [slot]: !prev[slot] }));
  };

  // Quick Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(data.subjects[0]?.id || 'accountancy');
  const [newType, setNewType] = useState<TaskType>('lecture');
  const [newDuration, setNewDuration] = useState(60);

  // Selected date tasks
  const selectedDayTasks = data.allTasks
    .filter((t) => t.dateKey === selectedDateKey)
    .sort((a, b) => a.order - b.order);

  const totalTasks = selectedDayTasks.length;
  const completedTasks = selectedDayTasks.filter((t) => t.done).length;
  const remainingTasks = Math.max(0, totalTasks - completedTasks);
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Day Schedule from template
  const dayOfWeek = selectedDate.getDay();
  const daySchedule = data.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);

  // Weekly Date Strip (7 cards: Monday to Sunday of the active week)
  const weekDays = getWeekDaysForDate(selectedDate);

  // Header Title
  const formattedHeaderDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Handle Quick Add Task Submit
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddTask({
      title: newTitle.trim(),
      subjectId: newSubjectId,
      type: newType,
      estimatedMinutes: Number(newDuration) || 30,
      dateKey: selectedDateKey,
    });
    setNewTitle('');
    setIsAddModalOpen(false);
  };

  // Calculate Subject This Week metrics
  const weekDatesSet = new Set(weekDays.map((w) => w.dateKey));
  const weekTasks = data.allTasks.filter((t) => weekDatesSet.has(t.dateKey));
  const subjectWeeklyStats = data.subjects.map((sub) => {
    const tasksForSub = weekTasks.filter((t) => t.subjectId === sub.id);
    const completed = tasksForSub.filter((t) => t.done).length;
    const total = tasksForSub.length;
    return {
      ...sub,
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // Circular progress SVG constants
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Header: Date + Nav Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{formattedHeaderDate}</span>
            <span className="text-amber-500 text-lg">☀️</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Let's complete your classes</p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => onSelectDateKey(addDays(selectedDateKey, -1))}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectDateKey(todayKey)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isSelectedToday
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Today
          </button>

          <button
            onClick={() => onSelectDateKey(addDays(selectedDateKey, 1))}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCalendar}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer ml-1"
            title="Open calendar"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Weekly Date Strip (7 Cards for Monday - Sunday) */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((wd) => {
          const isSelected = wd.dateKey === selectedDateKey;
          const dayTasks = data.allTasks.filter((t) => t.dateKey === wd.dateKey);
          const doneCount = dayTasks.filter((t) => t.done).length;
          const totalCount = dayTasks.length;
          const schedule = data.weeklySchedule.find((s) => s.dayOfWeek === wd.dayOfWeek);
          const isRest = schedule?.isRestDay;
          const allDone = totalCount > 0 && doneCount === totalCount;
          const hasDoneSome = doneCount > 0 && !allDone;

          const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

          // Short friendly date: e.g. "18 Oct"
          const dateObj = parseDateKey(wd.dateKey);
          const dayNum = dateObj.getDate();
          const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });

          return (
            <button
              key={wd.dateKey}
              onClick={() => onSelectDateKey(wd.dateKey)}
              className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative flex flex-col justify-between h-[88px] ${
                isSelected
                  ? 'border-blue-400 bg-blue-50/60 shadow-xs ring-1 ring-blue-300/60'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {wd.dayName.slice(0, 3)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5 leading-tight">
                    {dayNum} {monthShort}
                  </div>
                </div>

                {/* Status indicator icon in top right */}
                {isRest ? (
                  <span className="w-4 h-4 rounded-full border border-slate-200 flex items-center justify-center text-[9px] text-slate-400">
                    ·
                  </span>
                ) : allDone ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                ) : hasDoneSome ? (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-50" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300" />
                )}
              </div>

              <div>
                <div className="text-[11px] font-mono font-medium text-slate-600 mb-1">
                  {isRest ? '0/0' : `${doneCount}/${totalCount}`}
                </div>
                {/* Thin bottom progress bar */}
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      allDone ? 'bg-emerald-500' : hasDoneSome ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Main Content Split: Left Classes Column + Right Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Overdue Backlog + Today's Classes */}
        <div className="lg:col-span-8 space-y-5">
          {/* OVERDUE BACKLOG PANEL (Soft amber theme matching reference) */}
          {hasBacklog && (
            <div className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-5 shadow-xs transition-all">
              {/* Header */}
              <div
                onClick={() => setBacklogCollapsed(!backlogCollapsed)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/90 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                    <Hourglass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        Pending from previous days
                      </h2>
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-mono font-bold text-xs flex items-center justify-center">
                        {overdueTasks.length}
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/80 mt-0.5">
                      {isStrictLocked
                        ? "Complete these first to unlock today's classes."
                        : 'Overdue tasks carried forward from previous days.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {backlogCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Overdue Task List */}
              {!backlogCollapsed && (
                <div className="mt-4 space-y-2.5 pt-3 border-t border-amber-200/60">
                  {overdueTasks.map((task) => {
                    const sub = subjectMap.get(task.subjectId);
                    const daysOverdue = getDaysOverdue(task.dateKey, todayKey);

                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200/70 shadow-2xs hover:border-amber-300 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox */}
                          <button
                            onClick={() => onToggleTask(task.id)}
                            className="w-5 h-5 rounded-md border border-slate-300 hover:border-slate-500 bg-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            aria-label={`Mark ${task.title} complete`}
                          >
                            {task.done && <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />}
                          </button>

                          {/* Subject icon badge (e.g. coral red for Math) */}
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: sub?.color || '#f43f5e' }}
                          >
                            <SubjectIcon subjectId={task.subjectId} size={14} className="text-white" />
                          </div>

                          {/* Title & overdue info */}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {task.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-sans">
                              <span>Due: {formatFriendlyDate(task.dateKey)}</span>
                              <span>•</span>
                              <span className="text-rose-600 font-medium">
                                {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right badges: Type & Duration */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                            style={{
                              backgroundColor: `${sub?.color || '#f43f5e'}12`,
                              color: sub?.color || '#f43f5e',
                              borderColor: `${sub?.color || '#f43f5e'}25`,
                            }}
                          >
                            {task.type === 'lecture' ? 'Lecture' : 'DPP'}
                          </span>

                          <span className="text-[11px] font-sans text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {task.estimatedMinutes
                                ? task.estimatedMinutes >= 60
                                  ? `~ ${Math.round(task.estimatedMinutes / 60)} hr`
                                  : `~ ${task.estimatedMinutes} min`
                                : '~ 45 min'}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TODAY'S CLASSES SECTION */}
          <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-slate-700" />
                <h2 className="text-base font-bold text-slate-900">Today's Classes</h2>
              </div>
              <div className="text-xs font-medium text-slate-500 font-mono">
                {completedTasks} of {totalTasks} completed
              </div>
            </div>

            <p className="text-xs text-slate-500 -mt-2">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>

            {/* Class Cards Grouped by Class Slot */}
            {daySchedule?.classes
              .filter((c) => c.subjectId !== null)
              .map((classSlot) => {
                const sub = subjectMap.get(classSlot.subjectId!);
                const isCollapsed = collapsedClasses[classSlot.slot];

                // Tasks for this class slot on the selected date
                const classTasks = selectedDayTasks.filter(
                  (t) => t.classSlot === classSlot.slot
                );

                // Slot border accent color
                const accentColor = sub?.color || '#3b82f6';
                const isSlot1 = classSlot.slot === 1;
                const isSlot2 = classSlot.slot === 2;

                return (
                  <div
                    key={classSlot.slot}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all relative overflow-hidden"
                  >
                    {/* Left vertical subtle accent line */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: accentColor }}
                    />

                    {/* Class Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Number badge */}
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                          style={{
                            backgroundColor: `${accentColor}18`,
                            color: accentColor,
                          }}
                        >
                          {classSlot.slot}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 font-sans">
                          {sub?.name || 'Subject Class'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: `${accentColor}12`,
                            color: accentColor,
                            borderColor: `${accentColor}25`,
                          }}
                        >
                          Class {classSlot.slot}
                        </span>

                        <button
                          onClick={() => toggleClassCollapse(classSlot.slot)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tasks inside this Class Card */}
                    {!isCollapsed && (
                      <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-100">
                        {classTasks.length === 0 ? (
                          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
                            <span>Lecture & DPP classes pending</span>
                            {onEnsureTasks && (
                              <button
                                onClick={() => onEnsureTasks(selectedDateKey)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] cursor-pointer"
                              >
                                Generate
                              </button>
                            )}
                          </div>
                        ) : (
                          classTasks.map((task) => {
                            const isLec = task.type === 'lecture';
                            const isTaskLocked = isStrictLocked && !task.done;

                            return (
                              <div
                                key={task.id}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                  task.done
                                    ? 'bg-slate-50/60 border-slate-200/60 opacity-65'
                                    : isTaskLocked
                                    ? 'bg-slate-50/40 border-slate-200 opacity-60'
                                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => onToggleTask(task.id)}
                                    disabled={isTaskLocked}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                      task.done
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : isTaskLocked
                                        ? 'border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'border-slate-300 hover:border-slate-500 bg-white cursor-pointer'
                                    }`}
                                    title={
                                      isTaskLocked
                                        ? 'Locked: Complete overdue backlog tasks first'
                                        : 'Toggle task completion'
                                    }
                                  >
                                    {task.done ? (
                                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                    ) : isTaskLocked ? (
                                      <Lock className="w-3 h-3 text-slate-400" />
                                    ) : null}
                                  </button>

                                  {/* Icon: Blue/Green Book for Lecture, FileText for DPP */}
                                  <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                    style={{
                                      backgroundColor: `${accentColor}15`,
                                      color: accentColor,
                                    }}
                                  >
                                    {isLec ? (
                                      <BookOpen className="w-3.5 h-3.5" />
                                    ) : (
                                      <FileText className="w-3.5 h-3.5" />
                                    )}
                                  </div>

                                  {/* Title */}
                                  <span
                                    className={`text-xs font-semibold ${
                                      task.done ? 'line-through text-slate-400' : 'text-slate-900'
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                </div>

                                {/* Right details: Duration & Type Badge */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-[11px] font-sans text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>
                                      {task.estimatedMinutes
                                        ? task.estimatedMinutes >= 60
                                          ? `~ ${Math.round(task.estimatedMinutes / 60)} hr`
                                          : `~ ${task.estimatedMinutes} min`
                                        : isLec
                                        ? '~ 1 hr'
                                        : '~ 30 min'}
                                    </span>
                                  </span>

                                  {/* Type badge */}
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                      isLec
                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                        : 'bg-purple-50 text-purple-600 border-purple-100'
                                    }`}
                                  >
                                    {isLec ? 'Lecture' : 'DPP'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Custom Tasks (if any) */}
            {selectedDayTasks
              .filter((t) => t.type === 'custom' || !t.classSlot)
              .map((customTask) => (
                <div
                  key={customTask.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(customTask.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                        customTask.done
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {customTask.done && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                    <span className={`text-xs font-semibold ${customTask.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {customTask.title}
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                    Custom
                  </span>
                </div>
              ))}

            {/* + Add extra task button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add extra task</span>
            </button>
          </div>
        </div>

        {/* Right Column (4 cols): Information Panel matching reference */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Today's Progress Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 font-sans">
              Today's Progress
            </h3>

            <div className="flex items-center gap-5">
              {/* Circular Progress Ring */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className="stroke-slate-100"
                    strokeWidth="7"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="#3b82f6"
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-900 text-sm font-mono">
                  {completionPercent}%
                </div>
              </div>

              {/* Stats description */}
              <div className="space-y-1 text-xs">
                <div className="text-slate-700 font-medium font-sans">
                  {completedTasks} / {totalTasks} completed
                </div>
                <div className="text-slate-500 font-sans">
                  {remainingTasks} remaining
                </div>
                {overdueTasks.length > 0 && (
                  <div className="text-rose-600 font-semibold font-sans">
                    {overdueTasks.length} overdue
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Subjects (This Week) Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3.5 font-sans">
              Subjects (This Week)
            </h3>

            <div className="space-y-3">
              {subjectWeeklyStats.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: sub.color }}
                    >
                      <SubjectIcon subjectId={sub.id} size={12} className="text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 truncate">
                      {sub.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${sub.percent}%`,
                          backgroundColor: sub.color,
                        }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 w-6 text-right">
                      {sub.completed}/{sub.total}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Quick Actions Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900 mb-1 font-sans">
              Quick Actions
            </h3>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Add custom task</span>
            </button>

            <button
              onClick={onOpenCalendar}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4 text-slate-500" />
              <span>View calendar</span>
            </button>

            <button
              onClick={onOpenScheduleEdit}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Edit weekly schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-slate-900 font-sans">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Study Task</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Accountancy — Extra Problem Set"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    {data.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Task Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TaskType)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="dpp">DPP</option>
                    <option value="custom">Custom Task</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="10"
                  max="240"
                  step="5"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
