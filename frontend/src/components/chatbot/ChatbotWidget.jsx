import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatbotStore } from '../../store/chatbotStore';
import ChatbotPanel from './ChatbotPanel';
import './Chatbot.css';

const POSITION_KEY = 'soict_chatbot_position';
const DEFAULT_MARGIN = 24;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getStoredPosition() {
  try {
    const stored = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
    if (Number.isFinite(stored?.x) && Number.isFinite(stored?.y)) return stored;
  } catch {
    // Ignore invalid local storage values.
  }
  return null;
}

export default function ChatbotWidget() {
  const widgetRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, offsetX: 0, offsetY: 0 });
  const positionRef = useRef(null);
  const [position, setPosition] = useState(null);
  const userId = useAuthStore((state) => state.user?.id);
  const isOpen = useChatbotStore((state) => state.isOpen);
  const toggleChat = useChatbotStore((state) => state.toggleChat);
  const hydrateConversation = useChatbotStore((state) => state.hydrateConversation);

  useEffect(() => {
    const saved = getStoredPosition();
    if (saved) {
      setPosition(saved);
      return;
    }
    setPosition({
      x: Math.max(DEFAULT_MARGIN, window.innerWidth - 60 - DEFAULT_MARGIN),
      y: Math.max(DEFAULT_MARGIN, window.innerHeight - 60 - DEFAULT_MARGIN),
    });
  }, []);

  useEffect(() => {
    hydrateConversation(userId || null);
  }, [hydrateConversation, userId]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!position) return undefined;

    const clampToViewport = () => {
      const rect = widgetRef.current?.getBoundingClientRect();
      const width = rect?.width || (isOpen ? 420 : 60);
      const height = rect?.height || (isOpen ? 640 : 60);
      setPosition((current) => {
        if (!current) return current;
        const next = {
          x: clamp(current.x, 8, window.innerWidth - width - 8),
          y: clamp(current.y, 8, window.innerHeight - height - 8),
        };
        localStorage.setItem(POSITION_KEY, JSON.stringify(next));
        return next;
      });
    };

    clampToViewport();
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, [isOpen]);

  const startDrag = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!event.currentTarget.classList.contains('chatbot-fab') && event.target.closest('button, input, textarea, a')) return;

    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      active: true,
      moved: false,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event) => {
    if (!dragRef.current.active) return;
    const rect = widgetRef.current?.getBoundingClientRect();
    const width = rect?.width || 60;
    const height = rect?.height || 60;
    const next = {
      x: clamp(event.clientX - dragRef.current.offsetX, 8, window.innerWidth - width - 8),
      y: clamp(event.clientY - dragRef.current.offsetY, 8, window.innerHeight - height - 8),
    };
    if (Math.abs(next.x - (position?.x || 0)) > 2 || Math.abs(next.y - (position?.y || 0)) > 2) {
      dragRef.current.moved = true;
    }
    setPosition(next);
    positionRef.current = next;
  };

  const endDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (positionRef.current) localStorage.setItem(POSITION_KEY, JSON.stringify(positionRef.current));
  };

  const openFromFab = () => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    toggleChat();
  };

  const dragHandleProps = {
    onPointerDown: startDrag,
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };

  return (
    <div
      ref={widgetRef}
      className={`chatbot-widget ${dragRef.current.active ? 'chatbot-widget--dragging' : ''}`}
      style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
    >
      {isOpen && <ChatbotPanel dragHandleProps={dragHandleProps} />}
      {!isOpen && (
        <button
          className="chatbot-fab"
          type="button"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={openFromFab}
          aria-label="Open SoictStock AI Assistant"
          title="Drag or open SoictStock AI Assistant"
        >
          <span className="chatbot-fab__robot" aria-hidden="true">🤖</span>
        </button>
      )}
    </div>
  );
}
