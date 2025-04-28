/* eslint-disable react-hooks/exhaustive-deps */
import { twJoin } from 'tailwind-merge';
import { useEffect, useRef, HTMLAttributes } from 'react';
import { CanvasManager } from './canvas/canvas-manager';
import { useCanvasContext } from './canvas-context';

type PixelCanvasProps = HTMLAttributes<HTMLCanvasElement> & {
  sprites: string[];
  preferences: {
    size: number;
    color: {
      first: string;
      second: string;
    };
    borders: {
      isEnabled: boolean;
      color: string;
    };
  };
  fadeDuration?: number;
};

function PixelCanvas({
  className,
  sprites,
  preferences,
  fadeDuration = 500,
  ...props
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasManagerRef = useRef<CanvasManager | null>(null);
  const { setCamera, setCursor } = useCanvasContext();

  useEffect(() => {
    if (canvasRef.current) {
      canvasManagerRef.current = new CanvasManager(
        canvasRef.current,
        sprites,
        preferences,
        fadeDuration,
        setCamera,
        setCursor
      );

      return () => {
        if (canvasManagerRef.current) {
          canvasManagerRef.current.cleanup();
        }
      };
    }
  }, []);

  useEffect(() => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.updateProperties(
        sprites,
        preferences,
        fadeDuration
      );
    }
  }, [sprites, preferences, fadeDuration, preferences.borders.isEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className={twJoin(
        'h-full w-full cursor-auto touch-pinch-zoom',
        className
      )}
      {...props}
    />
  );
}

export { PixelCanvas };
