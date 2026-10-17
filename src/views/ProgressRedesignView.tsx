import React from 'react';
import { BarChart2, CheckCircle2, BookOpen, Clock } from 'lucide-react';
import { StudyDataState } from '../hooks/useStudyData';
import { formatFriendlyDate } from '../utils/dates';
import { SubjectIcon } from '../components/SubjectIcon';

interface ProgressRedesignViewProps {
  data: StudyDataState;
  onSelectDate: (dateKey: string) => void;
}

export const ProgressRedesignView: React.FC<ProgressRedesignViewProps> = ({
  data,
  onSelectDate,
}) => {
  // Aggregate study history by date
  const datesMap = new Map<string, { total: number; completed: number; tasks: typeof data.allTasks }>();

  data.allTasks.forEach((t) => {
    const entry = datesMap.get(t.dateKey) || { total: 0, completed: 0, tasks: [] };
    entry.total += 1;
    if (t.done) entry.completed += 1;
    entry.tasks.push(t);
    datesMap.set(t.dateKey, entry);
  });

  const sortedDates = Array.from(datesMap.entries()).sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <span>Academic Curriculum Progress</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Curriculum completion breakdown per subject and chronological study logs.
        </p>
      </div>

      {/* 1. Subject Breakdown Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Subjects Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.subjects.map((sub) => {
            const subTasks = data.allTasks.filter((t) => t.subjectId === sub.id);
            const doneLectures = subTasks.filter((t) => t.type === 'lecture' && t.done).length;
            const doneDpps = subTasks.filter((t) => t.type === 'dpp' && t.done).length;
            const planned = sub.plannedTotalLectures || 30;
            const remaining = Math.max(0, planned - doneLectures);
            const percentage = Math.min(100, Math.round((doneLectures / planned) * 100));

            return (
              <div
                key={sub.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs relative overflow-hidden"
              >
                {/* Top accent badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: sub.color }}
                    >
                      <SubjectIcon subjectId={sub.id} size={14} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{sub.name}</h3>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-700">
                    {percentage}%
                  </span>
                </div>

                {/* Metrics */}
                <div className="space-y-1.5 text-xs text-slate-600 font-sans mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed Lectures:</span>
                    <span className="font-semibold text-slate-900">
                      {doneLectures} / {planned}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining Lectures:</span>
                    <span className="font-semibold text-slate-900">{remaining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DPPs Completed:</span>
                    <span className="font-semibold text-emerald-600">{doneDpps}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: sub.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Chronological Study History Log */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Daily Study Records
        </h2>

        {sortedDates.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs rounded-2xl border border-dashed border-slate-200 bg-white">
            No study records saved yet. Complete classes on the Today page to record progress.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
            {sortedDates.map(([dateKey, stats]) => {
              const isAllDone = stats.total > 0 && stats.completed === stats.total;
              const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

              return (
                <div
                  key={dateKey}
                  onClick={() => onSelectDate(dateKey)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isAllDone
                          ? 'bg-emerald-100 text-emerald-600'
                          : stats.completed > 0
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isAllDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-mono font-bold">
                          {stats.completed}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {formatFriendlyDate(dateKey)}
                      </div>
                      <div className="text-slate-500 text-[11px] font-sans">
                        {stats.completed} of {stats.total} classes & DPPs completed
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-500 font-semibold">
                      {percent}%
                    </span>
                    <span className="text-blue-600 hover:text-blue-700 font-medium text-xs">
                      View Tasks →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
