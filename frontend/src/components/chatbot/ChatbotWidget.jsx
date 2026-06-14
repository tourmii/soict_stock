import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatbotStore } from '../../store/chatbotStore';
import ChatbotPanel from './ChatbotPanel';
import './Chatbot.css';

const POSITION_KEY = 'soict_chatbot_position';
const DEFAULT_MARGIN = 24;
const FAB_SIZE = 60;
const PANEL_MAX_WIDTH = 420;
const PANEL_MAX_HEIGHT = 640;
const PANEL_HORIZONTAL_MARGIN = 32;
const PANEL_VERTICAL_MARGIN = 48;
const VIEWPORT_GUTTER = 8;

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
      const width = rect?.width || 60;
      const height = rect?.height || 60;
      setPosition((current) => {
        if (!current) return current;
        const next = {
          x: clamp(current.x, 8, window.innerWidth - width - 8),
          y: clamp(current.y, 8, window.innerHeight - height - 8),
        };
        if (next.x === current.x && next.y === current.y) return current;
        localStorage.setItem(POSITION_KEY, JSON.stringify(next));
        return next;
      });
    };

    clampToViewport();
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, [isOpen, position]);

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
  const panelOffset = getPanelOffset(position);

  return (
    <div
      ref={widgetRef}
      className={`chatbot-widget ${dragRef.current.active ? 'chatbot-widget--dragging' : ''}`}
      style={position ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        '--chatbot-panel-left': `${panelOffset.x}px`,
        '--chatbot-panel-top': `${panelOffset.y}px`,
      } : undefined}
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

function getPanelOffset(position) {
  if (!position || typeof window === 'undefined') return { x: FAB_SIZE - PANEL_MAX_WIDTH, y: FAB_SIZE - PANEL_MAX_HEIGHT };

  const { width: panelWidth, height: panelHeight } = getPanelDimensions();
  const preferredLeft = position.x + FAB_SIZE - panelWidth;
  const spaceAbove = position.y + FAB_SIZE - VIEWPORT_GUTTER;
  const spaceBelow = window.innerHeight - position.y - VIEWPORT_GUTTER;
  let preferredTop = position.y + FAB_SIZE - panelHeight;

  if (spaceAbove < panelHeight && spaceBelow >= panelHeight) {
    preferredTop = position.y;
  } else if (spaceAbove < panelHeight && spaceBelow > spaceAbove) {
    preferredTop = position.y;
  }

  const viewportLeft = clamp(preferredLeft, VIEWPORT_GUTTER, window.innerWidth - panelWidth - VIEWPORT_GUTTER);
  const viewportTop = clamp(preferredTop, VIEWPORT_GUTTER, window.innerHeight - panelHeight - VIEWPORT_GUTTER);

  return {
    x: viewportLeft - position.x,
    y: viewportTop - position.y,
  };
}

function getPanelDimensions() {
  const compactViewport = window.innerWidth <= 520;

  return {
    width: compactViewport
      ? window.innerWidth - 24
      : Math.min(PANEL_MAX_WIDTH, window.innerWidth - PANEL_HORIZONTAL_MARGIN),
    height: compactViewport
      ? window.innerHeight - 24
      : Math.min(PANEL_MAX_HEIGHT, window.innerHeight - PANEL_VERTICAL_MARGIN),
  };
}
