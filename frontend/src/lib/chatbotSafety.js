const unsafeReplacements = [
  [/you should buy/gi, 'in the simulation, you can study'],
  [/you should sell/gi, 'in the simulation, you can review reducing exposure to'],
  [/buy this stock/gi, 'practice analyzing this simulated stock'],
  [/sell this stock/gi, 'practice reviewing this simulated position'],
  [/guaranteed profit/gi, 'no guaranteed outcome'],
  [/will definitely rise/gi, 'may rise or fall in the simulation'],
  [/cannot lose/gi, 'can still lose value'],
  [/professional financial advice/gi, 'educational simulation guidance'],
  [/recommend(?:ed|ation)? to buy/gi, 'simulation learning idea to review'],
  [/long-term accumulation recommended/gi, 'simulation-only value reasoning example'],
];

export function sanitizeFinancialAdviceLanguage(text = '') {
  return unsafeReplacements.reduce((safe, [pattern, replacement]) => safe.replace(pattern, replacement), text);
}

export function containsUnsafeAdvice(text = '') {
  return unsafeReplacements.some(([pattern]) => pattern.test(text));
}

export function addEducationalDisclaimer(response) {
  const disclaimer = 'This is educational guidance for a simulated market, not real financial advice.';
  if (!response.reply?.includes(disclaimer)) {
    return { ...response, reply: `${response.reply}\n\n${disclaimer}` };
  }
  return response;
}

export function makeResponseSimulationSafe(response) {
  const safeReply = sanitizeFinancialAdviceLanguage(response.reply || '');
  return addEducationalDisclaimer({ ...response, reply: safeReply });
}
