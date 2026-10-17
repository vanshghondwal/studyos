import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, Video, AlertCircle, Loader2, Moon } from 'lucide-react';
import { StudyDataState } from '../hooks/useStudyData';
import { DaySchedule, WeeklyClassSlot } from '../types';
import { WEEKDAY_NAMES } from '../utils/dates';

interface TimetableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StudyDataState;
  onUpdateSlot?: (dayOfWeek: number, slot: 1 | 2 | 3, subjectId: string | null) => Promise<void>;
  onSaveScheduleDay?: (daySchedule: DaySchedule) => Promise<{ success: boolean; message?: string }>;
  initialDayOfWeek?: number;
}

export const TimetableEditorModal: React.FC<TimetableEditorModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateSlot,
  onSaveScheduleDay,
  initialDayOfWeek = 1,
}) => {
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(initialDayOfWeek);
  const [isRestDay, setIsRestDay] = useState<boolean>(false);
  const [draftClasses, setDraftClasses] = useState<WeeklyClassSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync draft when selectedDayOfWeek changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const activeDay = data.weeklySchedule.find((s) => s.dayOfWeek === selectedDayOfWeek);
      if (activeDay) {
        const isRest = activeDay.isRestDay || activeDay.classes.every((c) => !c.subjectId);
        setIsRestDay(isRest);
        setDraftClasses(activeDay.classes.map((c) => ({ ...c })));
      } else {
        setIsRestDay(false);
        setDraftClasses([
          { slot: 1, subjectId: null },
          { slot: 2, subjectId: null },
          { slot: 3, subjectId: null },
        ]);
      }
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, selectedDayOfWeek, data.weeklySchedule]);

  if (!isOpen) return null;

  const activeDay = data.weeklySchedule.find((s) => s.dayOfWeek === selectedDayOfWeek);
  const activeDayName = activeDay ? activeDay.dayName : WEEKDAY_NAMES[selectedDayOfWeek];
  const followingDayName = WEEKDAY_NAMES[(selectedDayOfWeek + 1) % 7];

  const handleSlotChange = (slot: 1 | 2 | 3, subjectId: string | null) => {
    setSaveSuccess(false);
    setErrorMessage(null);
    setDraftClasses((curr) =>
      curr.map((c) => (c.slot === slot ? { ...c, subjectId } : c))
    );
  };

  const handleToggleRestDay = (checked: boolean) => {
    setIsRestDay(checked);
    setSaveSuccess(false);
    setErrorMessage(null);
    if (checked) {
      setDraftClasses((curr) => curr.map((c) => ({ ...c, subjectId: null })));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const effectiveRestDay = isRestDay || draftClasses.every((c) => !c.subjectId);

      const scheduleToSave: DaySchedule = {
        dayOfWeek: selectedDayOfWeek,
        dayName: activeDayName,
        isRestDay: effectiveRestDay,
        classes: [1, 2, 3].map((slotNum) => {
          const match = draftClasses.find((c) => c.slot === slotNum);
          return {
            slot: slotNum as 1 | 2 | 3,
            subjectId: effectiveRestDay ? null : (match?.subjectId || null),
          };
        }),
      };

      // 2. Persist to database & await transaction
      if (onSaveScheduleDay) {
        const res = await onSaveScheduleDay(scheduleToSave);
        if (!res.success) {
          throw new Error(res.message || 'Database transaction failed.');
        }
      } else if (onUpdateSlot) {
        for (const cls of scheduleToSave.classes) {
          await onUpdateSlot(selectedDayOfWeek, cls.slot, cls.subjectId);
        }
      }

      // 3. Show clear "Saved" indicator
      setSaveSuccess(true);
    } catch (err: unknown) {
      console.error('Error saving weekly schedule:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save changes to database.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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
              Classes set for <span className="font-bold underline">{activeDayName}</span> will be watched as recorded lectures on <span className="font-bold underline">{followingDayName}</span>.
            </span>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Day selector tabs (Monday through Sunday) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4">
          {data.weeklySchedule.map((day) => {
            const isSelected = day.dayOfWeek === selectedDayOfWeek;
            return (
              <button
                key={day.dayOfWeek}
                onClick={() => setSelectedDayOfWeek(day.dayOfWeek)}
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
                Mark {activeDayName} as a break day without mandatory classes
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

        {/* Day Class Slots Editor */}
        {isRestDay ? (
          <div className="p-6 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 text-center text-xs text-amber-800">
            <Moon className="w-6 h-6 text-amber-500 mx-auto mb-1.5 opacity-80" />
            <div className="font-bold">{activeDayName} is marked as a Rest Day</div>
            <div className="text-[11px] text-amber-700/80 mt-0.5">
              No mandatory Lecture or DPP tasks will be generated.
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {activeDayName} Classes
              </h3>
              <span className="text-xs text-slate-400 font-sans">
                3 daily class slots
              </span>
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

        {/* Footer with Save Schedule and Clear Saved Feedback */}
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
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSave}
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
  );
};
