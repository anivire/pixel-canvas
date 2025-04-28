'use client';

import { useState } from 'react';
import { PixelCanvas } from '../components/pixel-canvas';
import { useCanvasContext } from '../components/canvas-context';
import { useSprites } from '../components/use-sprites';
import { twJoin } from 'tailwind-merge';

function HomePage() {
  const { camera, cursor } = useCanvasContext();
  const [gridSize] = useState<number>(32);
  const [borders] = useState<{ isEnabled: boolean; color: string }>({
    isEnabled: true,
    color: '#3957ff',
  });
  const [colors] = useState<{ first: string; second: string }>({
    first: '#252525',
    second: '#303030',
  });

  const sprites = useSprites();

  return (
    <section className="flex h-screen w-screen flex-col">
      <div
        className={twJoin(
          'absolute bottom-3 left-3 flex flex-col',
          'bg-black-03/80 rounded-md px-3 py-2 text-xs tabular-nums backdrop-blur-md'
        )}
      >
        <p>
          cur: {cursor.x.toFixed(0)} {cursor.y.toFixed(0)}
        </p>
        <p>
          cam: {camera.x.toFixed(0)} {camera.y.toFixed(0)}
        </p>
      </div>
      <PixelCanvas
        sprites={sprites}
        preferences={{
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
