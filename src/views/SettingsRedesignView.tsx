import React, { useState } from 'react';
import {
  Settings,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Download,
  Upload,
  AlertTriangle,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { StudyDataState } from '../hooks/useStudyData';
import { db } from '../db/db';
import { Subject } from '../types';

interface SettingsRedesignViewProps {
  data: StudyDataState;
  onUpdateSettings: (updates: {
    backlogMode?: 'strict' | 'flexible';
    soundEnabled?: boolean;
    soundVolume?: number;
    userName?: string;
  }) => Promise<void>;
  onExportData: () => Promise<void>;
  onImportData: (jsonStr: string) => Promise<boolean>;
  onResetAllData: () => Promise<void>;
  onOpenScheduleEdit: () => void;
  onRefresh: () => Promise<void>;
  onGenerateAllDays?: () => Promise<void>;
}

export const SettingsRedesignView: React.FC<SettingsRedesignViewProps> = ({
  data,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetAllData,
  onOpenScheduleEdit,
  onRefresh,
  onGenerateAllDays,
}) => {
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('#3b82f6');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    const id = newSubName.toLowerCase().replace(/\s+/g, '-');
    await db.subjects.put({
      id,
      name: newSubName.trim(),
      color: newSubColor,
      bgColor: `${newSubColor}15`,
      borderColor: `${newSubColor}35`,
      order: data.subjects.length + 1,
      plannedTotalLectures: 30,
    });
    setNewSubName('');
    await onRefresh();
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (data.subjects.length <= 1) return;
    await db.subjects.delete(subjectId);
    await onRefresh();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>Application Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure backlog policy, timetable preferences, curriculum subjects, and data portability.
        </p>
      </div>

      {/* 1. Strict Backlog Dependency Rule (Feature 14) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            {data.userSettings.backlogMode === 'strict' ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Backlog Dependency Mode
            </h2>
            <p className="text-xs text-slate-500">
              Control whether today's classes remain locked when overdue tasks exist.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => onUpdateSettings({ backlogMode: 'strict' })}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              data.userSettings.backlogMode === 'strict'
                ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Strict Mode (Default)</span>
              </span>
              {data.userSettings.backlogMode === 'strict' && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mandatory tasks for today remain locked until all incomplete tasks from previous days are checked off.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ backlogMode: 'flexible' })}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              data.userSettings.backlogMode === 'flexible'
                ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5 text-blue-600" />
                <span>Flexible Mode</span>
              </span>
              {data.userSettings.backlogMode === 'flexible' && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Overdue tasks are prominently displayed at the top, but today's schedule is accessible in parallel.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Weekly Timetable Shortcut */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Curriculum Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize which subjects are scheduled for Class 1, 2, and 3 across each weekday.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGenerateAllDays && (
            <button
              onClick={onGenerateAllDays}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2"
              title="Ensure all 7 days have their complete 3 classes (Lectures & DPPs) generated"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Generate All Days</span>
            </button>
          )}
          <button
            onClick={onOpenScheduleEdit}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Timetable</span>
          </button>
        </div>
      </div>

      {/* 3. Subject Management */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Subjects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your academic subjects and distinct accent colors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {data.subjects.map((sub) => (
            <div
              key={sub.id}
              className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: sub.color }}
                />
                <span className="font-bold text-slate-900">{sub.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({sub.plannedTotalLectures || 30} lectures)
                </span>
              </div>

              {data.subjects.length > 1 && (
                <button
                  onClick={() => handleDeleteSubject(sub.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Delete subject"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Subject Inline Form */}
        <form onSubmit={handleAddSubject} className="flex flex-wrap items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Add new subject..."
            value={newSubName}
            onChange={(e) => setNewSubName(e.target.value)}
            className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
          <input
            type="color"
            value={newSubColor}
            onChange={(e) => setNewSubColor(e.target.value)}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-transparent cursor-pointer"
            title="Pick subject color"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </form>
      </div>

      {/* 4. Audio Chime */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            {data.userSettings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Task Audio Feedback</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Subtle synthesized offline chime on task completion.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            onUpdateSettings({ soundEnabled: !data.userSettings.soundEnabled })
          }
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            data.userSettings.soundEnabled
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {data.userSettings.soundEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* 5. Danger Zone */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Reset Application</h2>
        </div>
        <p className="text-xs text-slate-600">
          Reset all IndexedDB tables, clearing all tasks, historical records, and timetables back to default.
        </p>

        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-3.5 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Reset All Study Data...
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-white border border-rose-300 space-y-2">
            <p className="text-xs font-semibold text-rose-800">
              Are you sure? This will permanently erase your study records.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onResetAllData();
                  setShowConfirmReset(false);
                }}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
