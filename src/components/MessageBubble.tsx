'use client';

import { useState, useEffect } from 'react';
import { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [timeString, setTimeString] = useState('');

  // Format time on client side to avoid hydration mismatch
  useEffect(() => {
    setTimeString(message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [message.timestamp]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1">
          <img 
            src="/youth_renew_front.png" 
            alt="Youth Renew" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-purple-700 text-white'
            : 'bg-surface-2 text-text-1 border border-border'
        }`}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Uploaded"
            className="rounded-lg mb-2 max-w-full h-auto max-h-48 object-cover"
          />
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {timeString && (
          <span className={`text-xs mt-1 block ${isUser ? 'text-white/70' : 'text-text-3'}`}>
            {timeString}
          </span>
        )}
      </div>
    </div>
  );
}
