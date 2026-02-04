import { Eye } from 'lucide-react';
import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useBattleSocketStore } from '@/stores/battleSocketStore';

function SpectatorCountBadge() {
  const { spectatorCount } = useBattleSocketStore(
    useShallow((state) => ({
      spectatorCount: state.spectatorCount,
    })),
  );

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-base-faint px-5 py-2 text-sm font-medium text-base-primary">
      <Eye className="h-4 w-4 text-base-secondary" strokeWidth={2.5} />
      <span className="text-base-primary">{spectatorCount}</span>
    </div>
  );
}

export default memo(SpectatorCountBadge);
