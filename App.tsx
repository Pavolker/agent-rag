
import React, { useState, useCallback, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatInterface } from './components/ChatInterface';
import { Header } from './components/Header';
import { Message } from './types';
import { askAboutDocumentStream } from './services/openaiService';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }>{
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message || 'Erro desconhecido' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
          <div className="bg-gray-800/70 border border-red-500/40 rounded-xl p-6 max-w-xl text-center">
            <div className="text-red-400 font-bold mb-2">Ocorreu um erro na interface</div>
            <div className="text-sm text-gray-300 mb-4">{this.state.message}</div>
            <button onClick={() => location.reload()} className="px-4 py-2 bg-cyan-600 rounded">Recarregar</button>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const App: React.FC = () => {
  const [knowledgeBase, setKnowledgeBase] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proxyOk, setProxyOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(d => setProxyOk(!!d?.hasKey)).catch(() => setProxyOk(false));
  }, []);

  const handleFileLoad = (fileContent: string) => {
    setKnowledgeBase(fileContent);
    setMessages([
      {
        id: '1',
        role: 'model',
        text: 'Base de conhecimento carregada com sucesso! Sobre o que você gostaria de perguntar?',
        sources: [],
      },
    ]);
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !knowledgeBase) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      sources: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const modelId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: modelId, role: 'model', text: '', sources: [] }]);
      await askAboutDocumentStream(knowledgeBase, text, (chunk) => {
        setMessages((prev) => prev.map(m => m.id === modelId ? { ...m, text: m.text + chunk } : m));
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      const errorMessageObj: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: `Desculpe, encontrei um erro: ${errorMessage}`,
          sources: []
      }
       setMessages((prev) => [...prev, errorMessageObj]);

    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBase]);

  const handleClear = () => {
    setKnowledgeBase(null);
    setMessages([]);
    setIsLoading(false);
    setError(null);
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
        <Header onClear={handleClear} hasBase={knowledgeBase !== null} />
        {proxyOk !== null && (
          <div className={`text-center text-xs p-2 ${proxyOk ? 'text-green-400' : 'text-yellow-300'}`}>
            {proxyOk ? 'Proxy ativo' : 'Proxy indisponível ou sem chave'}
          </div>
        )}
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl h-full flex flex-col bg-gray-800/50 rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-sm">
            {knowledgeBase === null ? (
              <WelcomeScreen onFileLoad={handleFileLoad} />
            ) : (
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onClear={handleClear}
            />
          )}
        </div>
      </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
