import React, { useState } from 'react';
import { X, Sliders, Check, Video } from 'lucide-react';
import { StudyDataState } from '../hooks/useStudyData';
import { WEEKDAY_NAMES } from '../utils/dates';

interface TimetableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StudyDataState;
  onUpdateSlot: (dayOfWeek: number, slot: 1 | 2 | 3, subjectId: string | null) => Promise<void>;
}

export const TimetableEditorModal: React.FC<TimetableEditorModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateSlot,
}) => {
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // Monday default

  if (!isOpen) return null;

  const activeDay = data.weeklySchedule.find((s) => s.dayOfWeek === selectedDayOfWeek);
  const followingDayName = WEEKDAY_NAMES[(selectedDayOfWeek + 1) % 7];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-slate-900 font-sans">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Edit Weekly Timetable</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recorded lecture mapping notice */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 mb-4 flex items-start gap-2">
          <Video className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Recorded Lecture Mapping: </span>
            <span className="text-blue-800">
              Classes set for {activeDay?.dayName} will appear as recorded lectures on {followingDayName}.
            </span>
          </div>
        </div>


        {/* Day selector tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-5">
          {data.weeklySchedule.map((day) => {
            const isSelected = day.dayOfWeek === selectedDayOfWeek;
            return (
              <button
                key={day.dayOfWeek}
                onClick={() => setSelectedDayOfWeek(day.dayOfWeek)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {day.dayName.slice(0, 3)}
              </button>
            );
          })}
        </div>

        {/* Day Class Slots Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {activeDay?.dayName} Classes
            </h3>
            <span className="text-xs text-slate-400 font-sans">
              3 daily class slots
            </span>
          </div>

          {activeDay?.classes.map((cls) => (
            <div key={cls.slot} className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700">
                Class {cls.slot}
              </label>
              <select
                value={cls.subjectId || 'none'}
                onChange={async (e) => {
                  const val = e.target.value === 'none' ? null : e.target.value;
                  await onUpdateSlot(activeDay.dayOfWeek, cls.slot, val);
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

        <div className="flex justify-end pt-5 mt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
