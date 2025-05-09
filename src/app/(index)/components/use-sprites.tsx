/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useCanvasContext } from './canvas-context';

function useSprites(): string[] {
  const [sprites, setSprites] = useState<string[]>([]);
  const { setError } = useCanvasContext();

  useEffect(() => {
    async function fetchSprites() {
      try {
        const r = await fetch(`${process.env.API_URL}/api/sprites`);
        const res = await r.json();

        if (res) {
          if (Array.isArray(res) && res.length > 0) {
            setSprites(res.sort((a, b) => a.localeCompare(b)));
          } else {
            setSprites([]);
            setError(
              'Unable to load sprites or sprites array is empty, try again later'
            );
          }
        }
      } catch (e) {
        console.error(e);
        setError(
          'Unable to load sprites or sprites array is empty, try again later'
        );
      }
    }

    fetchSprites();
  }, []);

  return sprites;
}

export { useSprites };
