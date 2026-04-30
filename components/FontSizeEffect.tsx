'use client';

import { useEffect } from 'react';
import { usePassageStore } from '@/lib/store';

export default function FontSizeEffect() {
  const fontSize = usePassageStore(s => s.fontSize);
  useEffect(() => {
    document.documentElement.style.fontSize = fontSize + 'px';
  }, [fontSize]);
  return null;
}
