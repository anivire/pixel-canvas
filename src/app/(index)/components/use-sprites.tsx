import { useEffect, useState } from 'react';

function useSprites(): string[] {
  const [sprites, setSprites] = useState<string[]>([]);

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
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchSprites();
  }, []);

  return sprites;
}

export { useSprites };
