'use client';

import { RefreshIcon } from '@/components/icons';

export function OfflineActions() {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      <button type="button" onClick={() => window.location.reload()} className="btn-primary">
        <RefreshIcon className="h-4 w-4" />
        Try again
      </button>
      <button type="button" onClick={() => window.history.back()} className="btn-secondary">
        Go back
      </button>
    </div>
  );
}
