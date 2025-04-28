'use client';

import { useMemo, useState } from 'react';
import { PixelCanvas } from '../components/pixel-canvas';
import { useCanvasContext } from '../components/canvas-context';
import { useSprites } from '../components/use-sprites';
import { twJoin } from 'tailwind-merge';

function HomePage() {
  const { camera, cursor, error } = useCanvasContext();
  const [gridSize] = useState<number>(32);
  const [borders, setBorders] = useState<{ isEnabled: boolean; color: string }>(
    {
      isEnabled: true,
      color: '#3957ff',
    }
  );
  const [colors] = useState<{ first: string; second: string }>({
    first: '#252525',
    second: '#303030',
  });
  const [welcomeToastShowed, setIsWelcomeToastShowed] = useState<boolean>(true);

  const sprites = useSprites();

  const preferences = useMemo(() => {
    return {
      size: gridSize,
      color: {
        first: colors.first,
        second: colors.second,
      },
      borders: { ...borders },
    };
  }, [gridSize, colors, borders]);

  return (
    <section className="flex h-screen w-screen flex-col">
      <div
        className={twJoin(
          'absolute bottom-3 left-3 flex max-w-36 flex-col gap-2'
        )}
      >
        {welcomeToastShowed && (
          <div
            onClick={() => setIsWelcomeToastShowed(false)}
            className={twJoin(
              'flex flex-col gap-1',
              'rounded-md bg-blue-400/10 px-3 py-2 text-xs tabular-nums backdrop-blur-md',
              'cursor-pointer transition-transform duration-200 ease-in-out hover:scale-[103%]'
            )}
          >
            <p>
              pixel-canvas:{' '}
              <span className="text-blue-400">
                use mouse to navigate. Drag canvas by pressing LMB or MMB,
                scroll to zoom. Click on me to close.
              </span>
            </p>
          </div>
        )}

        {error && (
          <div
            className={twJoin(
              'flex flex-col gap-1',
              'bg-red-01/10 rounded-md px-3 py-2 text-xs tabular-nums backdrop-blur-md'
            )}
          >
            <p>
              error: <span className="text-red-01">{error}</span>
            </p>
          </div>
        )}

        <div
          className={twJoin(
            'flex flex-col gap-1',
            'bg-black-03/80 rounded-md px-3 py-2 text-xs tabular-nums backdrop-blur-md'
          )}
        >
          <p>
            border{' '}
            <button
              onClick={() =>
                setBorders(prev => ({
                  ...prev,
                  isEnabled: !prev.isEnabled,
                }))
              }
              className="text-gray-01 bg-gray-01/20 cursor-pointer rounded-md px-2"
            >
              {borders.isEnabled ? 'enabled' : 'disabled'}
            </button>
          </p>
          <p>
            cur:{' '}
            <span className="text-gray-01">
              {cursor.x.toFixed(0)} {cursor.y.toFixed(0)}
            </span>
          </p>
          <p>
            cam:{' '}
            <span className="text-gray-01">
              {camera.x.toFixed(0)} {camera.y.toFixed(0)}
            </span>
          </p>
        </div>
      </div>

      <PixelCanvas sprites={sprites} preferences={preferences} />
    </section>
  );
}

export { HomePage };
