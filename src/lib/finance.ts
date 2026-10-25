import type { IconName } from '../components/Icon';

const RULES: [RegExp, IconName][] = [
  [/fp&a|planning|forecast|budget/i, 'target'],
  [/model|valuation|dcf|lbo/i, 'chart'],
  [/market|research|intelligence|analy/i, 'search'],
  [/cash|treasury|working capital|liquidity/i, 'coins'],
  [/capital|invest|portfolio|allocation/i, 'pie'],
  [/risk|audit|control|compliance|governance/i, 'shield'],
  [/m&a|acquisition|merger|deal|due diligence/i, 'handshake'],
  [/cost|efficien|operation|process/i, 'gauge2'],
  [/report|dashboard|kpi|board|power bi|tableau/i, 'trend'],
  [/bank|lending|credit|debt/i, 'bank'],
  [/excel|sap|sql|python|erp|anaplan|oracle/i, 'cpu'],
  [/team|lead|mentor|people|stakeholder/i, 'users'],
];
const FALLBACK: IconName[] = ['search', 'target', 'gauge2', 'chart', 'coins', 'pie'];

export function iconFor(text: string, i = 0): IconName {
  return RULES.find(([re]) => re.test(text))?.[1] ?? FALLBACK[i % FALLBACK.length];
}

export function splitHeadline(headline: string): [string, string] {
  const [role, ...rest] = headline.split(/\s*[|·•]\s*|\s+[—–]\s+/);
  return [role?.trim() || headline, rest.join(' · ').trim()];
}

/** Splits text into balanced halves for the two-tone serif headline. */
export function twoLines(text: string): [string, string] {
  const words = text.split(/\s+/);
  if (words.length < 2) return [text, ''];
  let best = 1;
  let diff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (d < diff) {
      diff = d;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** First number in a sentence ("Released $18M…" → { pre: '$', n: 18, post: 'M' }) so it can count up. */
export function leadNumber(text: string): { pre: string; n: number; post: string; rest: string } | null {
  const m = text.match(/([$€£]?)(\d[\d,]*(?:\.\d+)?)\s?(%|[KMB]\b|x\b)?/);
  if (!m) return null;
  // a bare year ("Leader of the Year 2024") is a date, not a result — nothing to count
  if (!m[1] && !m[3] && /^(19|20)\d\d$/.test(m[2])) return null;
  return { pre: m[1], n: parseFloat(m[2].replace(/,/g, '')), post: m[3] ?? '', rest: text };
}
