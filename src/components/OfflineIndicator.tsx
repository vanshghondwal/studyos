import React, { useEffect, useState } from 'react';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded border border-zinc-300 bg-white text-zinc-900 px-3 py-1.5 text-xs font-medium shadow-sm">
          <WifiOff className="w-3.5 h-3.5 text-zinc-500" />
          <span>Offline — changes saved locally</span>
        </div>
      )}
    </>
  );
};

export const SavedToDBBadge: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 px-2 py-1 bg-slate-900/50 rounded border border-slate-800">
      <Database className="w-3 h-3 text-emerald-400" />
      <span>Local DB Synced</span>
    </div>
  );
};
