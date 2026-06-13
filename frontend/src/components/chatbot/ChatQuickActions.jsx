import { useLocation } from 'react-router-dom';

const defaults = [
  'Explain my portfolio',
  'Analyze my risk',
  'Recommend a lesson',
  'Explain diversification',
  'What is stop-loss?',
  'Why did this stock move?',
  'Help me place an order',
  'Connect to SoictStock consultant',
];

const byPage = {
  '/learn': ['What should I learn next?', 'Recommend a quiz', 'Review my learning progress'],
  '/portfolio': ['Explain my portfolio', 'Is my portfolio diversified?', 'What is unrealized P/L?'],
  '/simulation': ['Help me place an order', 'Explain market order', 'Explain limit order', 'Explain stop-loss'],
  '/leaderboard': ['How is ranking calculated?', 'Explain risk-adjusted performance'],
};

export default function ChatQuickActions({ onSelect, suggestions = [] }) {
  const { pathname } = useLocation();
  const pageActions = Object.entries(byPage).find(([path]) => pathname.startsWith(path))?.[1] || [];
  const actions = [...new Set([...(suggestions || []), ...pageActions, ...defaults])].slice(0, 8);
  return (
    <div className="chatbot-quick-actions">
      {actions.map((action) => (
        <button key={action} type="button" onClick={() => onSelect(action)}>
          {action}
        </button>
      ))}
    </div>
  );
}
