/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar, MainTab } from './components/Sidebar';
import { TodayDashboardView } from './views/TodayDashboardView';
import { WeeklyPlannerRedesignView } from './views/WeeklyPlannerRedesignView';
import { ProgressRedesignView } from './views/ProgressRedesignView';
import { SettingsRedesignView } from './views/SettingsRedesignView';
import { CalendarModal } from './components/CalendarModal';
import { ExportImportModal } from './components/ExportImportModal';
import { TimetableEditorModal } from './components/TimetableEditorModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useStudyData } from './hooks/useStudyData';
import { getTodayKey } from './utils/dates';
import { Menu, X, BookOpen } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<MainTab>('today');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(getTodayKey());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isScheduleEditOpen, setIsScheduleEditOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const studyData = useStudyData();

  if (!studyData.isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-500 font-sans text-xs">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-slate-600">Loading StudyOS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased flex flex-col md:flex-row">
      {/* 1. Desktop Left Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'today') {
              setSelectedDateKey(getTodayKey());
            }
          }}
          onOpenExportImport={() => setIsExportImportOpen(true)}
          overdueCount={studyData.overdueTasks.length}
        />
      </div>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white">
            <BookOpen className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="font-bold text-sm text-slate-900">StudyOS</span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-2xs">
          <div className="w-64 bg-white h-full shadow-2xl flex flex-col justify-between">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                currentTab={currentTab}
                onSelectTab={(tab) => {
                  setCurrentTab(tab);
                  setMobileMenuOpen(false);
                }}
                onOpenExportImport={() => {
                  setMobileMenuOpen(false);
                  setIsExportImportOpen(true);
                }}
                overdueCount={studyData.overdueTasks.length}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {currentTab === 'today' && (
          <TodayDashboardView
            data={studyData}
            selectedDateKey={selectedDateKey}
            onSelectDateKey={setSelectedDateKey}
            onToggleTask={studyData.toggleTask}
            onAddTask={studyData.addTask}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOpenScheduleEdit={() => setIsScheduleEditOpen(true)}
            onEnsureTasks={studyData.ensureTasksForDate}
          />
        )}

        {currentTab === 'planner' && (
          <WeeklyPlannerRedesignView
            data={studyData}
            onUpdateSlot={studyData.updateWeeklyScheduleSlot}
            onToggleTask={studyData.toggleTask}
            onSelectDate={(dateKey) => {
              setSelectedDateKey(dateKey);
              setCurrentTab('today');
            }}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressRedesignView
            data={studyData}
            onSelectDate={(dateKey) => {
              setSelectedDateKey(dateKey);
              setCurrentTab('today');
            }}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsRedesignView
            data={studyData}
            onUpdateSettings={studyData.updateUserSettings}
            onExportData={studyData.exportData}
            onImportData={studyData.importData}
            onResetAllData={studyData.resetAllData}
            onOpenScheduleEdit={() => setIsScheduleEditOpen(true)}
            onRefresh={studyData.refreshData}
            onGenerateAllDays={studyData.generateAllDaysTasks}
          />
        )}
      </main>

      {/* 3. Global Modals */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        data={studyData}
        selectedDateKey={selectedDateKey}
        onSelectDate={(dateKey) => {
          setSelectedDateKey(dateKey);
          setCurrentTab('today');
        }}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onExportData={studyData.exportData}
        onImportData={studyData.importData}
        onResetAllData={studyData.resetAllData}
      />

      <TimetableEditorModal
        isOpen={isScheduleEditOpen}
        onClose={() => setIsScheduleEditOpen(false)}
        data={studyData}
        onUpdateSlot={studyData.updateWeeklyScheduleSlot}
      />

      {/* Subtle Toast Notification */}
      {studyData.toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg">
          {studyData.toastMessage}
        </div>
      )}

      {/* Offline Status Banner */}
      <OfflineIndicator />
    </div>
  );
}
