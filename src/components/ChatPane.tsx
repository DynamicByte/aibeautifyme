'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Message, UserProfile } from '@/lib/types';
import MessageBubble from './MessageBubble';
import ImageUpload from './ImageUpload';

interface ChatPaneProps {
  onProfileUpdate: (profile: UserProfile, isComplete: boolean) => void;
}

export interface ChatPaneRef {
  focusInput: () => void;
}

const INITIAL_MESSAGE_CONTENT = "Welcome to AI Beautify Me! I'm VenusAI, here to help you build your perfect skincare routine. Let's start - what's your skin type? (dry, oily, combination, normal, or sensitive)";

const ChatPane = forwardRef<ChatPaneRef, ChatPaneProps>(({ onProfileUpdate }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [profile, setProfile] = useState<UserProfile>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    },
  }));

  // Initialize messages on client side to avoid hydration mismatch
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '0',
        role: 'assistant',
        content: INITIAL_MESSAGE_CONTENT,
        timestamp: new Date(),
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((!inputValue.trim() && !pendingImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      imageUrl: pendingImage || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setPendingImage(null);
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
          userProfile: profile,
          mode: isComplete ? 'chat' : 'consultation',
          questionIndex,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update profile and state if in consultation mode
      if (data.mode === 'consultation') {
        if (data.updatedProfile) {
          setProfile(data.updatedProfile);
        }
        if (data.questionIndex !== undefined) {
          setQuestionIndex(data.questionIndex);
        }
        if (data.isComplete) {
          setIsComplete(true);
          onProfileUpdate(data.updatedProfile, true);
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an issue. Please try again.",
        timestamp: new Date(),
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

  const handleImageCapture = (imageUrl: string) => {
    setPendingImage(imageUrl);
  };

  return (
    <div className="flex flex-col h-full bg-surface-1 rounded-xl border border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-1">Skin Consultation</h2>
        <p className="text-sm text-text-3">
          {isComplete 
            ? "Ask me anything about your routine" 
            : "Answer a few questions to get your personalized routine"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
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

      {/* Pending Image Preview */}
      {pendingImage && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img src={pendingImage} alt="Preview" className="h-20 rounded-lg" />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-2 -right-2 bg-surface-3 rounded-full p-1 hover:bg-red-500 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-2">
          <ImageUpload onImageCapture={handleImageCapture} />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isComplete ? "Ask about your routine..." : "Type your response..."}
            className="flex-1 bg-transparent text-text-1 placeholder-text-3 outline-none text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={(!inputValue.trim() && !pendingImage) || isLoading}
            className="p-2 bg-gold-700 text-on-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

ChatPane.displayName = 'ChatPane';

export default ChatPane;
