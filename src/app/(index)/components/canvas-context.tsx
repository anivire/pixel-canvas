import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
  useMemo,
} from 'react';
import { createContext } from 'react';
import { Position } from './canvas/models/position';
import { CanvasProperties } from './canvas/models/canvas-properties';

type CanvasContextProps = {
  camera: Position;
  cursor: Position;
  error: string;
  preferences: CanvasProperties;
  setCamera: Dispatch<SetStateAction<Position>>;
  setCursor: Dispatch<SetStateAction<Position>>;
  setError: Dispatch<SetStateAction<string>>;
  setPreferences: Dispatch<SetStateAction<CanvasProperties>>;
};

const CanvasContext = createContext<CanvasContextProps | undefined>(undefined);

export const CanvasContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [camera, setCamera] = useState<Position>({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<Position>({ x: 0, y: 0 });
  const [preferences, setPreferences] = useState<CanvasProperties>({
    borders: {
      color: '#3957ff',
      isEnabled: true,
    },
    color: {
      first: '#252525',
      second: '#303030',
    },
    size: 32,
  });
  const [error, setError] = useState<string>('');

  const value = useMemo(
    () => ({
      camera,
      cursor,
      error,
      preferences,
      setCamera,
      setCursor,
      setError,
      setPreferences,
    }),
    [camera, cursor, error, preferences]
  );

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
};

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error(
      'useCanvasContext must be used within an CanvasContextProvider'
    );
  }
  return context;
};
