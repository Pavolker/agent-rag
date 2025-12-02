
import React from 'react';
import { GroundingChunk } from '../types';
import { LinkIcon } from './icons';

interface SourceListProps {
  sources: GroundingChunk[];
}

export const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  return (
    <div className="mt-4 pt-3 border-t border-gray-600/50">
      <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Fontes:</h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => {
          const webSource = source.web;
          if (!webSource || !webSource.uri) return null;
          
          return (
            <a
              key={index}
              href={webSource.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gray-600/50 hover:bg-gray-500/50 text-cyan-300 text-sm px-3 py-1 rounded-full transition-colors duration-200"
            >
              <LinkIcon className="h-3 w-3" />
              <span>{webSource.title || new URL(webSource.uri).hostname}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
