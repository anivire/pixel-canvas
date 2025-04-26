'use client';

import { useState } from 'react';
import { PixelCanvas } from '../components/pixel-canvas';

function HomePage() {
  const [gridSize] = useState<number>(32);
  const [borders] = useState<{ isEnabled: boolean; color: string }>({
    isEnabled: true,
    color: '#3957ff',
  });
  const [colors] = useState<{ first: string; second: string }>({
    first: '#252525',
    second: '#303030',
  });

  return (
    <section className="flex h-screen w-screen flex-col">
      <PixelCanvas
        grid={{
          size: gridSize,
          color: {
            first: colors.first,
            second: colors.second,
          },
          borders: borders,
        }}
      />
    </section>
  );
}

export { HomePage };
