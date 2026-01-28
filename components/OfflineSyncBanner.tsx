'use client';

import { useState, useEffect } from 'react';

interface SyncItem {
  id: string;
  seanceId: string;
  token: string;
  timestamp: number;
}

export default function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load sync queue from localStorage
    try {
      const queue = localStorage.getItem('scanQueue');
      if (queue) {
        setSyncQueue(JSON.parse(queue));
      }
    } catch {
      // Ignore errors
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncQueue_ = async () => {
    if (!isOnline || syncQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const failed: SyncItem[] = [];

    for (const item of syncQueue) {
      try {
        const res = await fetch('/api/student/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seanceId: item.seanceId,
            token: item.token,
            scannedAt: new Date(item.timestamp),
          }),
        });

        if (!res.ok) {
          failed.push(item);
        }
      } catch {
        failed.push(item);
      }
    }

    if (failed.length > 0) {
      setSyncQueue(failed);
      localStorage.setItem('scanQueue', JSON.stringify(failed));
    } else {
      setSyncQueue([]);
      localStorage.removeItem('scanQueue');
    }

    setIsSyncing(false);
  };

  if (isOnline && syncQueue.length === 0) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
        <p className="font-bold">Mode Hors Ligne</p>
        <p className="text-sm">Les scans seront synchronisés à la reconnexion.</p>
      </div>
    );
  }

  if (syncQueue.length > 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
        <p className="font-bold">Synchronisation en cours...</p>
        <p className="text-sm">{syncQueue.length} scan(s) à synchroniser</p>
        <button
          onClick={syncQueue_}
          disabled={isSyncing}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
        </button>
      </div>
    );
  }

  return null;
}
