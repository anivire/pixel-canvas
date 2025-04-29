'use client';

import { useState } from 'react';
import { PixelCanvas } from '../components/pixel-canvas';
import { useCanvasContext } from '../components/canvas-context';
import { useSprites } from '../components/use-sprites';
import { twJoin } from 'tailwind-merge';

function HomePage() {
  const { camera, cursor, error, preferences, setPreferences } =
    useCanvasContext();
  const [welcomeToastShowed, setIsWelcomeToastShowed] = useState<boolean>(true);
  const sprites = useSprites();

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
              'rounded-md bg-blue-900/80 px-3 py-2 text-xs tabular-nums backdrop-blur-md',
              'cursor-pointer transition-transform duration-200 ease-in-out hover:scale-[103%]'
            )}
          >
            <p>
              pixel-canvas:{' '}
              <span className="text-blue-300">
                use mouse to navigate. Drag canvas by holding MMB, focus on
                sprite by clicking on LMB, scroll to zoom. Click on this popup
                to close.
              </span>
            </p>
          </div>
        )}

        {error && (
          <div
            className={twJoin(
              'flex flex-col gap-1',
              'rounded-md bg-red-900/80 px-3 py-2 text-xs tabular-nums backdrop-blur-md'
            )}
          >
            <p>
              error: <span className="text-red-300">{error}</span>
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
                setPreferences(prev => ({
                  ...prev,
                  borders: {
                    ...prev.borders,
                    isEnabled: !prev.borders.isEnabled,
                  },
                }))
              }
              className="text-gray-01 bg-gray-01/20 cursor-pointer rounded-md px-2"
            >
              {preferences.borders.isEnabled ? 'enabled' : 'disabled'}
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
