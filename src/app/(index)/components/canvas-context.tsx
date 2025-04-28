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
  setCamera: Dispatch<SetStateAction<Position>>;
  setCursor: Dispatch<SetStateAction<Position>>;
};

const CanvasContext = createContext<CanvasContextProps | undefined>(undefined);

export const CanvasContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [camera, setCamera] = useState<Position>({ x: 0, y: 0 });
  const [cursor, setCursor] = useState<Position>({ x: 0, y: 0 });

  const value = useMemo(
    () => ({ camera, cursor, setCamera, setCursor }),
    [camera, cursor]
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
