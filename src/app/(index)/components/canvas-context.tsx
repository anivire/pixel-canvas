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

type CanvasContextProps = {
  camera: Position;
  cursor: Position;
  error: string;
  setCamera: Dispatch<SetStateAction<Position>>;
  setCursor: Dispatch<SetStateAction<Position>>;
  setError: Dispatch<SetStateAction<string>>;
};

const CanvasContext = createContext<CanvasContextProps | undefined>(undefined);

export const CanvasContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [camera, setCamera] = useState<Position>({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<Position>({ x: 0, y: 0 });
  const [error, setError] = useState<string>('');

  const value = useMemo(
    () => ({ camera, cursor, error, setCamera, setCursor, setError }),
    [camera, cursor, error]
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
