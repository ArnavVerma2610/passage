'use client';

import { useEffect } from 'react';
import { usePassageStore } from '@/lib/store';

export default function FontSizeEffect() {
  const fontSize = usePassageStore(s => s.fontSize);
  const theme    = usePassageStore(s => s.theme);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize + 'px';
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
