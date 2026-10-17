import React, { useRef, useState } from 'react';
import { X, Download, Upload, AlertCircle } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportData: () => Promise<void>;
  onImportData: (jsonStr: string) => Promise<boolean>;
  onResetAllData: () => Promise<void>;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  onExportData,
  onImportData,
  onResetAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        await onImportData(text);
        onClose();
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl text-slate-900 font-sans">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Backup & Data Management</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <p className="text-slate-500 mb-3 leading-relaxed">
              StudyOS stores all tasks, classes, and schedules 100% offline in your browser's IndexedDB. Export your data to keep a backup or transfer to another device.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onExportData}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            {!showConfirmReset ? (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
              >
                Reset all study data to defaults...
              </button>
            ) : (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Are you sure?</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  This will reset all tasks, history, and schedule back to initial defaults.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onResetAllData();
                      setShowConfirmReset(false);
                      onClose();
                    }}
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg font-medium text-xs hover:bg-rose-700 cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
