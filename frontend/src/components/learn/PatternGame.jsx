import { useState, useMemo, useCallback } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { STOCKS } from '../../lib/constants';
import { CANDLESTICK_PATTERNS } from '../../lib/learningData';
import { formatCurrency } from '../../lib/formatters';

export default function PatternGame() {
  const getHistories = useMarketStore((s) => s.getHistories);
  const rawTicks = useMarketStore((s) => s.rawTicks);
  const histories = useMemo(() => getHistories(), [rawTicks]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const generateChallenge = useCallback(() => {
    const tickers = Object.keys(histories);
    if (tickers.length === 0) return null;
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const hist = histories[ticker];
    if (!hist || hist.length < 30) return null;

    // Find a pattern in the history
    for (let attempt = 0; attempt < 50; attempt++) {
      const startIdx = Math.floor(Math.random() * (hist.length - 20)) + 5;
      for (const pattern of CANDLESTICK_PATTERNS) {
        if (pattern.detect(hist, startIdx)) {
          const segment = hist.slice(startIdx - 5, startIdx + 8);
          const patternIdx = 5;
          const afterMove = hist[startIdx + 3]
            ? ((hist[startIdx + 3].close - hist[startIdx].close) / hist[startIdx].close * 100)
            : 0;

          // Generate wrong answers
          const wrongPatterns = CANDLESTICK_PATTERNS
            .filter((p) => p.name !== pattern.name)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          const options = [pattern, ...wrongPatterns].sort(() => Math.random() - 0.5);
          const correctIdx = options.findIndex((o) => o.name === pattern.name);

          return { ticker, segment, patternIdx, pattern, afterMove, options, correctIdx, stock: STOCKS.find((s) => s.ticker === ticker) };
        }
      }
    }

    // Fallback: random segment with random pattern question
    const ticker2 = tickers[0];
    const hist2 = histories[ticker2];
    const start = Math.max(0, hist2.length - 20);
    const segment = hist2.slice(start, start + 13);
    const randomPattern = CANDLESTICK_PATTERNS[Math.floor(Math.random() * CANDLESTICK_PATTERNS.length)];
    const options = CANDLESTICK_PATTERNS.slice(0, 4).sort(() => Math.random() - 0.5);
    return { ticker: ticker2, segment, patternIdx: 5, pattern: randomPattern, afterMove: 0, options, correctIdx: 0, stock: STOCKS.find((s) => s.ticker === ticker2) };
  }, [histories]);

  const challenge = useMemo(() => generateChallenge(), [round, generateChallenge]);

  const handleAnswer = (idx) => {
    if (answered) return;
    setAnswered(true);
    setSelectedAnswer(idx);
    const isCorrect = idx === challenge.correctIdx;
    setCorrect(isCorrect);
    if (isCorrect) setScore((s) => s + 1);
    setTotalRounds((r) => r + 1);
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    setAnswered(false);
    setSelectedAnswer(null);
    setCorrect(false);
  };

  if (!challenge) {
    return <div className="lab-empty"><span style={{ fontSize: '48px' }}>🕯️</span><p>Loading pattern data...</p></div>;
  }

  return (
    <div className="pattern-game">
      <div className="pattern-game__header">
        <div className="pattern-game__score">
          <span className="pattern-game__score-icon">🏆</span>
          <span>{score}/{totalRounds}</span>
        </div>
        <h4>Identify the Candlestick Pattern</h4>
        <p className="pattern-game__subtitle">
          Look at the highlighted candle(s) on <strong style={{ color: challenge.stock?.color }}>{challenge.ticker}</strong> and identify the pattern
        </p>
      </div>

      {/* Mini candlestick chart */}
      <div className="pattern-chart">
        <div className="pattern-chart__candles">
          {challenge.segment.map((bar, i) => {
            const isHighlight = i === challenge.patternIdx;
            const isGreen = bar.close >= bar.open;
            const allPrices = challenge.segment.flatMap((b) => [b.high, b.low]);
            const minP = Math.min(...allPrices);
            const maxP = Math.max(...allPrices);
            const range = maxP - minP || 1;
            const scale = 200 / range;

            const bodyTop = Math.max(bar.open, bar.close);
            const bodyBot = Math.min(bar.open, bar.close);
            const bodyH = Math.max((bodyTop - bodyBot) * scale, 2);
            const bodyY = (maxP - bodyTop) * scale;
            const wickTop = (maxP - bar.high) * scale;
            const wickBot = (maxP - bar.low) * scale;
            const wickH = wickBot - wickTop;

            return (
              <div key={i} className={`pattern-candle ${isHighlight ? 'pattern-candle--highlight' : ''}`} style={{ height: '220px', position: 'relative' }}>
                {/* Wick */}
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: `${wickTop}px`, width: '2px', height: `${wickH}px`, background: isGreen ? '#22C55E' : '#EF4444' }} />
                {/* Body */}
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: `${bodyY}px`, width: isHighlight ? '18px' : '14px', height: `${bodyH}px`, background: isGreen ? '#22C55E' : '#EF4444', borderRadius: '2px', border: isHighlight ? '2px solid #1B3BFC' : 'none', boxShadow: isHighlight ? '0 0 8px rgba(27,59,252,0.3)' : 'none' }} />
                {isHighlight && <div style={{ position: 'absolute', bottom: '-24px', left: '50%', transform: 'translateX(-50)', fontSize: '10px', color: '#1B3BFC', fontWeight: 700 }}>▲</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div className="pattern-options">
        {challenge.options.map((opt, idx) => {
          let cls = 'pattern-option';
          if (answered) {
            if (idx === challenge.correctIdx) cls += ' pattern-option--correct';
            else if (idx === selectedAnswer) cls += ' pattern-option--wrong';
          }
          return (
            <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={answered}>
              <span className="pattern-option__name">{opt.name}</span>
              <span className="pattern-option__type" style={{ color: opt.type === 'bullish' ? '#22C55E' : opt.type === 'bearish' ? '#EF4444' : '#F59E0B' }}>
                {opt.type}
              </span>
              <span className="pattern-option__desc">{opt.description}</span>
            </button>
          );
        })}
      </div>

      {/* Result */}
      {answered && (
        <div className={`pattern-result ${correct ? 'pattern-result--correct' : 'pattern-result--wrong'}`}>
          <div className="pattern-result__icon">{correct ? '✅' : '❌'}</div>
          <div>
            <strong>{correct ? 'Correct!' : `That was a ${challenge.pattern.name}`}</strong>
            <p>{challenge.pattern.description}</p>
            {challenge.afterMove !== 0 && (
              <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                Price moved {challenge.afterMove > 0 ? '+' : ''}{challenge.afterMove.toFixed(2)}% after this pattern
              </p>
            )}
          </div>
        </div>
      )}

      {answered && (
        <button className="btn btn-primary" onClick={nextRound} style={{ marginTop: '16px', width: '100%' }}>
          Next Pattern →
        </button>
      )}
    </div>
  );
}
