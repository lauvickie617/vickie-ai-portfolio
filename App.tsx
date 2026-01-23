
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from './types';
import { SUGGESTED_QUESTIONS } from './constants';
import { sendMessageToGemini } from './services/gemini';

interface InteractionGroupProps {
  hasMessages: boolean;
  inputValue: string;
  setInputValue: (val: string) => void;
  handleSendMessage: (text: string) => void;
  isVisible: boolean;
}

const InteractionGroup: React.FC<InteractionGroupProps> = ({
  hasMessages,
  inputValue,
  setInputValue,
  handleSendMessage,
  isVisible
}) => (
  <div className={`flex flex-col gap-6 w-full max-w-[840px] mx-auto transition-opacity duration-1000 ${isVisible ? 'opacity-100 fade-in-content' : 'opacity-0'}`}>
    {!hasMessages && (
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="flex flex-wrap justify-center gap-3">
          {SUGGESTED_QUESTIONS.slice(0, 3).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="whitespace-nowrap flex h-9 sm:h-11 items-center justify-center rounded-full border border-gray-300 dark:border-[#2A2A2A] bg-transparent hover:bg-gray-100 dark:hover:bg-[#1A1A1A] px-3 sm:px-6 hover:border-[#149383] hover:text-[#149383] transition-all duration-200 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          {SUGGESTED_QUESTIONS.slice(3).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="whitespace-nowrap flex h-9 sm:h-11 items-center justify-center rounded-full border border-gray-300 dark:border-[#2A2A2A] bg-transparent hover:bg-gray-100 dark:hover:bg-[#1A1A1A] px-3 sm:px-6 hover:border-[#149383] hover:text-[#149383] transition-all duration-200 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    )}

    <div className="relative group w-full">
      <div className="flex items-center rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] p-1.5 sm:p-2 pr-2 sm:pr-3 transition-all focus-within:ring-2 focus-within:ring-[#149383]/30 focus-within:border-[#149383]/50 shadow-sm">
        <input
          className="flex-1 bg-transparent border-none focus:ring-0 px-3 sm:px-5 py-2.5 sm:py-4 text-base sm:text-lg placeholder:text-gray-400 dark:placeholder:text-gray-600 text-gray-900 dark:text-white"
          placeholder="Ask a question..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
          type="text"
          autoFocus={!hasMessages && isVisible}
        />
        <button
          onClick={() => handleSendMessage(inputValue)}
          disabled={!inputValue.trim()}
          className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[14px] sm:rounded-[18px] bg-[#149383] text-white hover:brightness-110 disabled:opacity-30 disabled:grayscale transition-all shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined font-bold">arrow_upward</span>
        </button>
      </div>
    </div>

    <div className={`flex flex-col items-center ${hasMessages ? 'gap-1 sm:gap-4' : 'gap-2 sm:gap-4'}`}>
      <span className={`text-gray-400 dark:text-[#555] ${hasMessages ? 'text-[8px] sm:text-[10px]' : 'text-[10px]'} font-bold tracking-[0.2em] uppercase`}>Contact Me:</span>
      <div className={`flex items-center ${hasMessages ? 'gap-4 sm:gap-10' : 'gap-6 sm:gap-10'}`}>
        <a
          className="text-gray-500 dark:text-gray-400 hover:text-[#149383] dark:hover:text-[#149383] transition-colors"
          href="https://www.linkedin.com/in/vickie-liu-ab617232b/"
          target="_blank"
          rel="noreferrer"
          title="LinkedIn"
        >
          <svg className="w-5 h-5 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
          </svg>
        </a>
        <a
          className="text-gray-500 dark:text-gray-400 hover:text-[#149383] dark:hover:text-[#149383] transition-colors flex items-center"
          href="mailto:vickieliuoffer@gmail.com"
          title="Email"
        >
          <span className="material-symbols-outlined text-[24px] sm:text-[32px]">mail</span>
        </a>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [typedTitle, setTypedTitle] = useState("");
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [introPhase, setIntroPhase] = useState<'title' | 'subtitle' | 'complete'>('title');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  // Initial Typewriter logic
  useEffect(() => {
    const titleText = "Hi, I'm Vickie Liu.";
    const subText = "Ask my AI about my Product Management journey.";

    let isMounted = true;

    const runIntro = async () => {
      // Small pause before starting
      await new Promise(r => setTimeout(r, 500));

      // Phase 1: Title
      for (let i = 0; i <= titleText.length; i++) {
        if (!isMounted) return;
        setTypedTitle(titleText.slice(0, i));
        await new Promise(r => setTimeout(r, 60));
      }

      if (!isMounted) return;
      setIntroPhase('subtitle');
      await new Promise(r => setTimeout(r, 400)); // Pause between title and sub

      // Phase 2: Subtitle
      for (let i = 0; i <= subText.length; i++) {
        if (!isMounted) return;
        setTypedSubtitle(subText.slice(0, i));
        await new Promise(r => setTimeout(r, 30));
      }

      if (!isMounted) return;
      setIntroPhase('complete');
    };

    runIntro();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isThinking, scrollToBottom]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const runTypewriter = async (fullText: string, messageId: string) => {
    let currentText = "";
    const chars = fullText.split('');
    const speed = 15;

    for (let i = 0; i < chars.length; i++) {
      currentText += chars[i];
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, content: currentText } : m
      ));
      scrollToBottom();
      await new Promise(resolve => setTimeout(resolve, speed));
    }

    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isGenerating: false } : m
    ));
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await sendMessageToGemini(text, history);

    setIsThinking(false);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: "",
      timestamp: Date.now(),
      isGenerating: true
    };

    setMessages(prev => [...prev, assistantMsg]);
    runTypewriter(response, assistantMsgId);
  }, [messages, scrollToBottom]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const hasMessages = messages.length > 0;

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212]' : 'bg-[#F9F8F6]'}`}>

      <button
        onClick={toggleTheme}
        className="fixed top-3 right-3 sm:top-6 sm:right-6 z-50 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-[#242424] border border-[#333] hover:border-[#149383] transition-all shadow-md group"
      >
        <span className="material-symbols-outlined icon-delayed text-[18px] sm:text-[22px] w-[18px] sm:w-[22px] h-[18px] sm:h-[22px] overflow-hidden text-white/80 group-hover:text-[#149383]">
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative scroll-smooth"
      >
        <div className={`min-h-full flex flex-col items-center transition-all duration-700 ${!hasMessages ? 'justify-center py-20' : 'justify-start pt-16'}`}>

          <div className={`w-full max-w-[960px] px-6 flex flex-col items-center text-center transition-all duration-500 ${!hasMessages ? 'mb-12' : 'mb-12 opacity-80 scale-90'}`}>
            <h1 className={`text-gray-900 dark:text-white text-2xl sm:text-4xl md:text-[56px] font-extrabold tracking-tight leading-tight min-h-[1.2em] ${introPhase === 'title' ? 'cursor-active' : ''}`}>
              {typedTitle}
            </h1>
            <p className={`mt-2 sm:mt-4 text-gray-500 dark:text-[#9DA3A0] text-base sm:text-lg md:text-xl font-medium min-h-[1.5em] ${introPhase === 'subtitle' ? 'cursor-active' : ''}`}>
              {typedSubtitle}
            </p>
          </div>

          {hasMessages && (
            <div className="w-full max-w-[960px] px-4 sm:px-6 space-y-6 sm:space-y-10 pb-[160px] sm:pb-[210px]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`
                      max-w-[90%] sm:max-w-[85%] px-4 sm:px-7 py-3 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border
                      ${msg.role === 'user'
                        ? 'rounded-tr-sm bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-200 border-gray-200 dark:border-[#2A2A2A]'
                        : 'rounded-tl-sm bg-[#149383] text-white border-[#149383] shadow-lg shadow-[#149383]/10'
                      }
                    `}
                  >
                    <div className={`message-stream text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap ${msg.isGenerating ? 'cursor-active' : ''}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="rounded-[2rem] rounded-tl-sm bg-[#149383] px-7 py-5 flex items-center gap-4 shadow-lg shadow-[#149383]/10">
                    <div className="flex items-center">
                      <span className="typing-dot bg-white/80"></span>
                      <span className="typing-dot bg-white/80"></span>
                      <span className="typing-dot bg-white/80"></span>
                    </div>
                    <span className="text-xs text-white/90 font-bold uppercase tracking-[0.15em]">Thinking</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}

          {!hasMessages && (
            <div className="w-full px-6">
              <InteractionGroup
                hasMessages={hasMessages}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSendMessage={handleSendMessage}
                isVisible={introPhase === 'complete'}
              />
            </div>
          )}
        </div>
      </div>

      {hasMessages && (
        <div className={`fixed bottom-0 left-0 w-full z-40 pt-6 sm:pt-12 pb-4 sm:pb-10 transition-colors duration-300 pointer-events-none ${theme === 'dark' ? 'bg-gradient-to-t from-[#121212] via-[#121212] to-transparent' : 'bg-gradient-to-t from-[#F9F8F6] via-[#F9F8F6] to-transparent'}`}>
          <div className="px-4 sm:px-6 pointer-events-auto">
            <InteractionGroup
              hasMessages={hasMessages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSendMessage={handleSendMessage}
              isVisible={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
