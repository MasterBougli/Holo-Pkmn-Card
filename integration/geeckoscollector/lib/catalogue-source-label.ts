import { normalNumber } from "./catalogue-import-types";

export function sourceCardLabel(value: string): { name: string; printedNumber?: string } | null {
  const label = value.trim();
  if (!label) return null;
  // Promos and special subsets omit the denominator; unnumbered energies use a dash.
  const denominated = label.match(/^(.*\S)\s+([A-Za-z0-9_.-]+)\/[^\s/]+$/u);
  const numbered = denominated ?? label.match(/^(.*\S)\s+((?=[A-Za-z0-9_.-]*\d)[A-Za-z0-9_.-]+|[—–-])(?:\/[^\s/]+)?$/u);
  if (!numbered) return { name: label };
  const printedNumber = /^[—–-]$/.test(numbered[2]) ? undefined : normalNumber(numbered[2]);
  return { name: numbered[1].trim(), ...(printedNumber ? { printedNumber } : {}) };
}

export function sourceCardNumbers<T extends { scanId: string; printedNumber?: string }>(cards: T[], code: string) {
  const numbers = cards.map(card => card.printedNumber);
  // Reprint collections and decks can reuse printed numbers. Their scan positions remain distinct.
  const usePrinted = code !== "30C" && numbers.every(Boolean) && new Set(numbers).size === cards.length;
  return cards.map(card => ({ ...card, number: usePrinted ? card.printedNumber! : normalNumber(card.scanId) }));
}
