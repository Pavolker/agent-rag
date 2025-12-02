
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { SendIcon } from './icons';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClear?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, onClear }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="flex items-center space-x-3 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-2xl p-4 max-w-lg">
                <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
                <span className="text-sm text-cyan-300 font-medium">Processando sua pergunta...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-gray-800/70 border-t border-gray-700/50 sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Faça uma pergunta..."
            className="flex-grow bg-gray-700/50 border-2 border-gray-600/50 rounded-full py-3 px-6 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
            disabled={isLoading}
          />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-md border border-gray-600"
            >
              Recomeçar
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all duration-300 flex-shrink-0"
          >
            <SendIcon className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
};
