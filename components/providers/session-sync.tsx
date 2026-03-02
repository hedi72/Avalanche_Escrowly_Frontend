'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import useStore from '@/lib/store';

export function SessionSync() {
  const { data: session, status } = useSession();
  const { syncWithNextAuthSession } = useStore();

  useEffect(() => {
    if (status !== 'loading') {
      syncWithNextAuthSession(session);
    }
  }, [session, status, syncWithNextAuthSession]);

  return null;
}