import { useNavigate } from 'react-router-dom';

export default function ChatMessage({ message, onSuggestion }) {
  const navigate = useNavigate();
  const isUser = message.role === 'user';

  const handleCard = (card) => {
    if (card.path) navigate(card.path);
  };

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className="chat-message__bubble">
        <p>{message.content}</p>
        {!isUser && message.cards?.length > 0 && (
          <div className="chat-cards">
            {message.cards.map((card, index) => (
              <button key={`${card.type}-${index}`} className={`chat-card chat-card--${card.type}`} onClick={() => handleCard(card)}>
                <span className="chat-card__type">{card.type}</span>
                <strong>{card.title}</strong>
                {card.description && <small>{card.description}</small>}
                {card.metrics?.length > 0 && (
                  <div className="chat-card__metrics">
                    {card.metrics.map((metric) => (
                      <span key={metric.label}>{metric.label}: <b>{metric.value}</b></span>
                    ))}
                  </div>
                )}
                {card.actionLabel && <em>{card.actionLabel}</em>}
              </button>
            ))}
          </div>
        )}
        {!isUser && message.suggestions?.length > 0 && (
          <div className="chat-message__suggestions">
            {message.suggestions.slice(0, 4).map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => onSuggestion(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="chat-message__meta">{isUser ? 'You' : 'AI Assistant'}</span>
    </div>
  );
}
