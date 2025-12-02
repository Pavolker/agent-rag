
import React from 'react';
import { Message } from '../types';
import { SourceList } from './SourceList';
import { GoogleIcon, UserIcon } from './icons';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const bubbleClasses = isUser
    ? 'bg-purple-600/80 self-end rounded-br-none'
    : 'bg-gray-700/80 self-start rounded-bl-none';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-3 max-w-xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
         <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUser ? 'bg-purple-500' : 'bg-cyan-500'}`}>
           {isUser ? <UserIcon className="h-6 w-6" /> : <GoogleIcon className="h-6 w-6" />}
         </div>
         <div className={`p-4 rounded-2xl shadow-md ${bubbleClasses}`}>
          <p className="text-white whitespace-pre-wrap">{message.text}</p>
          {message.sources && message.sources.length > 0 && (
            <SourceList sources={message.sources} />
          )}
        </div>
      </div>
    </div>
  );
};
