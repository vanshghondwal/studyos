import React from 'react';
import {
  Home,
  Calendar,
  BarChart2,
  Settings,
  ArrowDownUp,
  BookOpen,
} from 'lucide-react';

export type MainTab = 'today' | 'planner' | 'progress' | 'settings';

interface SidebarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenExportImport: () => void;
  overdueCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenExportImport,
  overdueCount = 0,
}) => {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between py-6 px-4 select-none h-screen sticky top-0">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 px-3">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-4 h-4 fill-white" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight font-sans">
            StudyOS
          </span>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          <button
            onClick={() => onSelectTab('today')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
              currentTab === 'today'
                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className={`w-4 h-4 ${currentTab === 'today' ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>Today</span>
            </div>
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-100 text-amber-700">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('planner')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
              currentTab === 'planner'
                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
            }`}
          >
            <Calendar className={`w-4 h-4 ${currentTab === 'planner' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Weekly Planner</span>
          </button>

          <button
            onClick={() => onSelectTab('progress')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
              currentTab === 'progress'
                ? 'bg-blue-50/80 text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
            }`}
          >
            <BarChart2 className={`w-4 h-4 ${currentTab === 'progress' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Progress</span>
          </button>
        </nav>
      </div>

      {/* Footer Navigation: Settings & Export / Import */}
      <div className="space-y-1 pt-4 border-t border-slate-100">
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
            currentTab === 'settings'
              ? 'bg-blue-50/80 text-blue-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Settings</span>
        </button>

        <button
          onClick={onOpenExportImport}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all duration-150 cursor-pointer"
        >
          <ArrowDownUp className="w-4 h-4 text-slate-500" />
          <span>Export / Import</span>
        </button>
      </div>
    </aside>
  );
};
