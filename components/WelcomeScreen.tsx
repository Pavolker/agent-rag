import React, { useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { DocumentIcon, UploadIcon, SpinnerIcon } from './icons';

// Configura o worker para o pdf.js a partir de um CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface WelcomeScreenProps {
  onFileLoad: (fileContent: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFileLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const normalizeMarkdown = (text: string) => {
    let t = text;
    t = t.replace(/^```[\s\S]*?```/gm, '');
    t = t.replace(/^---[\s\S]*?---/gm, '');
    t = t.replace(/\!\[[^\]]*\]\([^\)]*\)/g, '');
    t = t.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');
    t = t.replace(/^\s*>+\s?/gm, '');
    t = t.replace(/^\s*#+\s?/gm, '');
    t = t.replace(/\*\*|__|\*|_/g, '');
    t = t.replace(/^\s*[-*+]\s+/gm, '');
    t = t.replace(/\r/g, '');
    return t.trim();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      let combined = '';
      const total = files.length;
      for (let idx = 0; idx < total; idx++) {
        const file = files[idx];
        setProcessingMessage(`Processando arquivo ${idx + 1} de ${total}...`);
        if (file.type === 'application/pdf') {
          const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve((e.target?.result as ArrayBuffer) || new ArrayBuffer(0));
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
          });
          if (buffer.byteLength > 0) {
            const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
            const numPages = pdf.numPages;
            for (let i = 1; i <= numPages; i++) {
              setProcessingMessage(`Lendo página ${i} de ${numPages} do arquivo ${idx + 1}...`);
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
              combined += pageText + '\n\n';
            }
          }
        } else {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve((e.target?.result as string) || '');
            reader.onerror = reject;
            reader.readAsText(file);
          });
          const isMarkdown = file.name.toLowerCase().endsWith('.md') || file.type === 'text/markdown';
          const normalized = (isMarkdown ? normalizeMarkdown(text) : text).trim();
          combined += normalized + '\n\n';
        }
      }
      const result = combined.trim();
      if (!result) alert('Nenhum conteúdo legível foi encontrado nos arquivos.');
      onFileLoad(result);
    } catch (err) {
      console.error('Erro inesperado ao processar múltiplos arquivos:', err);
      alert('Ocorreu um erro inesperado ao carregar os arquivos.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="mb-6">
        <DocumentIcon className="h-20 w-20 text-cyan-400" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
        Agente Interpretador
      </h1>
      <p className="text-gray-300 max-w-2xl mb-8 text-lg">
        Para começar, carregue um arquivo de texto (.txt, .md) ou PDF (.pdf) que servirá como base de conhecimento.
      </p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.md,.pdf"
        multiple
        disabled={isProcessing}
      />
      <button
        onClick={handleButtonClick}
        disabled={isProcessing}
        className="flex items-center justify-center px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300/50 disabled:bg-gray-600 disabled:cursor-wait"
      >
        {isProcessing ? (
          <>
            <SpinnerIcon className="animate-spin h-6 w-6 mr-3" />
            {processingMessage}
          </>
        ) : (
          <>
            <UploadIcon className="h-6 w-6 mr-3" />
            Carregar Base de Conhecimento (.txt, .md, .pdf)
          </>
        )}
      </button>
    </div>
  );
};
