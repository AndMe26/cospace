'use client';

import { useEffect, useState } from 'react';

export function ClientClock(): React.JSX.Element {
  const [timeString, setTimeString] = useState<string | null>(null);

  useEffect(() => {
    const formatCurrentTime = (): string =>
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    const timeoutId = setTimeout(() => {
      setTimeString(formatCurrentTime());
    }, 0);

    const intervalId = setInterval(() => {
      setTimeString(formatCurrentTime());
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  if (timeString === null) {
    return (
      <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2.5 py-1 rounded-md">
        --:--:--
      </span>
    );
  }

  return (
    <span
      title="Hora local del cliente"
      className="text-xs text-gray-600 font-mono bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200"
    >
      🕒 {timeString}
    </span>
  );
}