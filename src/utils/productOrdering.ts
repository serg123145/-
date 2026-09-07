import { Product } from '../types';

/**
 * Extracts a trailing number inside parentheses or brackets at the end of a title.
 * Examples:
 * - "Хрестоподібна розв'язка (1)" -> 1
 * - "Набір опор (6 шт.)" -> 6
 * - "Гнучкі рейки (2 шт. по 15 см)" -> 2
 * - "Комплект (12 шт.)" -> 12
 * - "Адаптер (02)" -> 2
 * - "Деталь (№15)" -> 15
 * - "Елемент [4]" -> 4
 * - "Міст (X-Cross)" -> null (no digits)
 * - "Локомотивне депо" -> null (no parentheses)
 */
export function extractTrailingParenthesizedNumber(title: string | undefined | null): number | null {
  if (!title) return null;
  const trimmed = title.trim();

  // Look for the last (...) or [...] at the end of the string,
  // allowing optional trailing whitespace or punctuation (. , ! ? ;)
  const match = trimmed.match(/[\(\[]([^\)\]]+)[\)\]][.,;!?\s]*$/);
  if (!match) return null;

  const inner = match[1].trim();

  // Find the first sequence of digits inside the parentheses
  const digitMatch = inner.match(/\d+/);
  if (digitMatch) {
    const parsed = parseInt(digitMatch[0], 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Strips the trailing parenthesized segment to obtain the base title.
 */
export function extractBaseTitle(title: string | undefined | null): string {
  if (!title) return '';
  return title.replace(/[\(\[][^\)\]]+[\)\]][.,;!?\s]*$/, '').trim();
}

/**
 * Compares two products by the numbers in parentheses at the end of their titles.
 * 1. Items WITH a trailing parenthesized number come first, ordered numerically ascending (1, 2, 3... 10, 12, 100).
 * 2. If both items have the same number (e.g. both have 6), they are sorted alphabetically by title.
 * 3. Items WITHOUT a trailing parenthesized number follow after, sorted alphabetically by title.
 */
export function compareProductsByTrailingParenthesizedNumber(a: Product, b: Product): number {
  const numA = extractTrailingParenthesizedNumber(a.title);
  const numB = extractTrailingParenthesizedNumber(b.title);

  // Case 1: Both products have trailing numbers in parentheses
  if (numA !== null && numB !== null) {
    if (numA !== numB) {
      return numA - numB; // Numerical order: 1, 2, 3... 12
    }
    return a.title.localeCompare(b.title, 'uk');
  }

  // Case 2: Only one product has a trailing number in parentheses
  if (numA !== null && numB === null) {
    return -1; // a comes first
  }
  if (numA === null && numB !== null) {
    return 1; // b comes first
  }

  // Case 3: Neither has a trailing number in parentheses -> alphabetical
  return a.title.localeCompare(b.title, 'uk');
}

/**
 * Finds sibling variants for a product that share the same base title,
 * ordered by their trailing parenthesized number.
 */
export function findSiblingNumberedProducts(target: Product, allProducts: Product[]): Product[] {
  const targetBase = extractBaseTitle(target.title).toLowerCase();
  if (!targetBase) return [];

  return allProducts
    .filter(p => p.id !== target.id)
    .filter(p => {
      const pBase = extractBaseTitle(p.title).toLowerCase();
      return pBase === targetBase ||
             (targetBase.length > 5 && pBase.startsWith(targetBase)) ||
             (pBase.length > 5 && targetBase.startsWith(pBase));
    })
    .sort(compareProductsByTrailingParenthesizedNumber);
}
