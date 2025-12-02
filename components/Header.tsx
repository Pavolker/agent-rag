
import React from 'react';
import { GoogleIcon } from './icons';

type Props = { onClear?: () => void; hasBase?: boolean };

export const Header: React.FC<Props> = ({ onClear, hasBase }) => {
  const leftLogo = (import.meta as any).env.VITE_LEFT_LOGO_URL || '/centauro.jpg';
  const rightLogo = (import.meta as any).env.VITE_RIGHT_LOGO_URL || '/mdh.gif';
  return (
    <header className="p-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
      <div className="grid grid-cols-3 items-center">
        <div className="flex items-center">
          <img src={leftLogo} alt="Centauro" className="h-8 w-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Agente Interpretador</h1>
        </div>
        <div className="flex items-center justify-end space-x-3">
          <img src={rightLogo} alt="MDH" className="h-8 w-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          {hasBase && onClear && (
            <button
              onClick={onClear}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-md border border-gray-600"
            >
              Recomeçar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
