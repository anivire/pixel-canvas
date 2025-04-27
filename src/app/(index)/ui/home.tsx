'use client';

import { useState } from 'react';
import { PixelCanvas } from '../components/pixel-canvas';

function HomePage() {
  const [gridSize] = useState<number>(32);
  const [borders] = useState<{ isEnabled: boolean; color: string }>({
    isEnabled: false,
    color: '#3957ff',
  });
  const [colors] = useState<{ first: string; second: string }>({
    first: '#252525',
    second: '#303030',
  });

  return (
    <section className="flex h-screen w-screen flex-col">
      {/* <div className="bg-black-03 absolute bottom-3 left-3 flex flex-col rounded-md px-3 py-1 text-xs tabular-nums">
        <p>
          cur: {cursor.x}:{cursor.y}
        </p>
        <p>
          cam: {camera.x}:{camera.y}
        </p>
      </div> */}
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
