'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ChatPane from '@/components/ChatPane';
import RoutinePane from '@/components/RoutinePane';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import { UserProfile, RoutineStep } from '@/lib/types';
import { generateRoutine } from '@/lib/chatEngine';

export default function Home() {
  const [routine, setRoutine] = useState<RoutineStep[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const { theme } = useTheme();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatPaneRef = useRef<{ focusInput: () => void }>(null);

  useEffect(() => {
    // Check if user has already seen the video this session
    const hasSeenVideo = sessionStorage.getItem('venusai_video_seen');
    if (!hasSeenVideo) {
      setShowVideoModal(true);
    }
  }, []);

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const handleCloseModal = () => {
    setShowVideoModal(false);
    sessionStorage.setItem('venusai_video_seen', 'true');
  };

  const handleChatNow = () => {
    handleCloseModal();
    // Focus on chat input after modal closes
    setTimeout(() => {
      chatPaneRef.current?.focusInput();
    }, 100);
  };

  const handlePlayVideo = () => {
    setVideoStarted(true);
    videoRef.current?.play();
  };

  const handleProfileUpdate = (profile: UserProfile, complete: boolean) => {
    if (complete) {
      const generatedRoutine = generateRoutine(profile);
      setRoutine(generatedRoutine);
      setIsComplete(true);
    }
  };

  const backgroundImage = theme === 'dark' 
    ? "url('/youth-renew-bg-dark.jpg')" 
    : "url('/youth-renew-background.jpg')";

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      style={{
        backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <header className="border-b border-border bg-surface-1">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
              <img 
                src="/youth_renew.png" 
                alt="Youth Renew" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-1 font-brand">AI Beautify Me</h1>
              <p className="text-xs text-text-3">Your Personal Skincare Expert</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/account/login"
              className="px-4 py-2 bg-purple-700 text-on-primary rounded-lg text-sm font-medium hover:bg-purple-500 transition"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content - 2 Pane Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-120px)]">
          {/* Chat Pane - 60% */}
          <div className="lg:col-span-3">
            <ChatPane ref={chatPaneRef} onProfileUpdate={handleProfileUpdate} />
          </div>
          {/* Routine Pane - 40% */}
          <div className="lg:col-span-2">
            <RoutinePane routine={routine} isComplete={isComplete} />
          </div>
        </div>
      </main>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10 md:p-16 bg-black/85">
          <div className="relative w-full max-w-lg">
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="absolute -top-8 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1 transition z-10"
            >
              Skip
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video container */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
              <video
                ref={videoRef}
                src="/Venus_AI.mp4"
                playsInline
                onEnded={handleVideoEnd}
                className="w-full h-auto max-h-[75vh] object-contain"
                
              />

              {/* Play button - shows before video starts */}
              {!videoStarted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button
                    onClick={handlePlayVideo}
                    className="w-20 h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition shadow-lg transform hover:scale-110"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-purple-600 ml-1">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Chat Now button - appears when video ends */}
              {videoEnded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-fade-in">
                  <button
                    onClick={handleChatNow}
                    className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition shadow-lg transform hover:scale-105"
                  >
                    Chat Now!
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
