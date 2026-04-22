'use client';

import { useState, useRef, useEffect } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'assistant',
  content: "Hi! I'm your Routine Assistant. I can help you with:\n\n• Understanding your routine steps\n• Product usage tips and timing\n• Ingredient benefits and interactions\n• Answering skincare questions\n\nHow can I help you today?",
};

export default function RoutineAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory,
          mode: 'chat',
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "I apologize, but I couldn't process that. Please try again.",
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "What order should I apply my products?",
    "Can I use all products together?",
    "When should I apply sunscreen?",
    "How long should I wait between steps?",
  ];

  return (
    <div className="p-6 h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-1">Routine Assistant</h1>
        <p className="text-text-3">Get personalized help with your skincare routine</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-surface-1 border border-border rounded-xl flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1">
                  <img src="/youth_renew_front.png" alt="Assistant" className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-700 text-white'
                    : 'bg-surface-2 text-text-1 border border-border'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1">
                <img src="/youth_renew_front.png" alt="Assistant" className="w-full h-full object-cover" />
              </div>
              <div className="bg-surface-2 border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-text-3 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInputValue(q)}
                  className="px-3 py-1.5 bg-surface-2 text-text-2 rounded-full text-xs hover:bg-surface-3 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 bg-surface-2 rounded-xl px-4 py-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your routine..."
              className="flex-1 bg-transparent text-text-1 placeholder-text-3 outline-none text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
