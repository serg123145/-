/**
 * Utility functions for calculating title similarity and grouping similar products
 * so that products with very similar names are displayed adjacent to each other.
 */

// Common Ukrainian, Russian, and English stop words / generic filler words
const STOP_WORDS = new Set([
  'для', 'та', 'і', 'й', 'з', 'із', 'зі', 'в', 'у', 'на', 'по', 'до', 'від', 'про',
  'під', 'над', 'при', 'як', 'це', 'що', 'або', 'чи', 'теж',
  'для', 'и', 'с', 'со', 'в', 'во', 'на', 'по', 'к', 'ко', 'от', 'под', 'над', 'при',
  'for', 'and', 'with', 'in', 'on', 'at', 'to', 'from', 'by', 'of', 'the', 'a', 'an'
]);

// Generic units and filler terms that don't distinguish product models
const GENERIC_FILLER_TERMS = new Set([
  'шт', 'штук', 'штуки', 'шт.', 'шт)', 'набір', 'набор', 'комплект', 'сет',
  'set', 'pcs', 'pack', '3d', 'eco', 'pla', 'pla+', 'brio', 'ikea'
]);

/**
 * Normalizes text for comparison: lowercases, strips accents, removes punctuation.
 */
export function normalizeTitle(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[«»""''`]/g, '')
    .replace(/[\(\)\[\]\{\}\/\\,\.:;!?\+\*#№]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple Ukrainian/Russian/English word stemmer to handle plural/grammatical endings.
 */
export function stemWord(word: string): string {
  if (word.length <= 3) return word;
  
  // Strip common Slavic noun/adjective suffixes (case endings, gender, plural)
  let stem = word;
  
  // Common multi-letter endings
  const endings = [
    'оподібна', 'оподібні', 'оподібний', 'оподібне',
    'івського', 'івський', 'івська', 'івські',
    'ковий', 'кова', 'кове', 'кові',
    'ний', 'на', 'не', 'ні', 'ного', 'ному', 'ним', 'них',
    'ський', 'ська', 'ське', 'ські',
    'ями', 'ами', 'ою', 'ею', 'ів', 'ев', 'ей',
    'ий', 'ій', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие',
    'ів', 'их', 'их', 'ам', 'ям', 'ом', 'ем',
    'ка', 'ки', 'ку', 'ок', 'ек', 'ик', 'ики',
    'а', 'я', 'о', 'е', 'у', 'ю', 'и', 'і', 'ы'
  ];

  for (const ending of endings) {
    if (stem.length > ending.length + 3 && stem.endsWith(ending)) {
      stem = stem.slice(0, -ending.length);
      break;
    }
  }

  return stem;
}

/**
 * Tokenizes a title into meaningful stems, filtering out noise words.
 */
export function extractTitleTokens(title: string): { tokens: string[]; stems: string[] } {
  const normalized = normalizeTitle(title);
  const rawWords = normalized.split(/\s+/).filter(w => w.length > 0);

  const meaningfulWords = rawWords.filter(
    w => !STOP_WORDS.has(w) && !GENERIC_FILLER_TERMS.has(w)
  );

  const tokens = meaningfulWords.length > 0 ? meaningfulWords : rawWords;
  const stems = tokens.map(stemWord);

  return { tokens, stems };
}

/**
 * Calculates character bigram Dice coefficient (range 0 to 1).
 */
function bigramDiceSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitle(str1).replace(/\s/g, '');
  const s2 = normalizeTitle(str2).replace(/\s/g, '');

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (str: string) => {
    const map = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      map.set(bigram, (map.get(bigram) || 0) + 1);
    }
    return map;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);

  let intersection = 0;
  for (const [bigram, count1] of bg1.entries()) {
    const count2 = bg2.get(bigram);
    if (count2) {
      intersection += Math.min(count1, count2);
    }
  }

  return (2 * intersection) / ((s1.length - 1) + (s2.length - 1));
}

/**
 * Calculates similarity between two titles (0.0 to 1.0).
 */
export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  if (!titleA || !titleB) return 0;
  if (titleA.trim().toLowerCase() === titleB.trim().toLowerCase()) return 1.0;

  const { stems: stemsA, tokens: tokensA } = extractTitleTokens(titleA);
  const { stems: stemsB, tokens: tokensB } = extractTitleTokens(titleB);

  if (stemsA.length === 0 || stemsB.length === 0) return 0;

  const setA = new Set(stemsA);
  const setB = new Set(stemsB);

  // Intersection of stems
  let commonCount = 0;
  for (const s of setA) {
    if (setB.has(s)) {
      commonCount++;
    }
  }

  const unionCount = new Set([...setA, ...setB]).size;
  const stemJaccard = unionCount > 0 ? commonCount / unionCount : 0;

  // Exact token match bonus
  const tokenSetA = new Set(tokensA);
  const tokenSetB = new Set(tokensB);
  let exactTokenCommon = 0;
  for (const t of tokenSetA) {
    if (tokenSetB.has(t)) {
      exactTokenCommon++;
    }
  }
  const tokenJaccard = tokenSetA.size + tokenSetB.size > 0 
    ? (2 * exactTokenCommon) / (tokenSetA.size + tokenSetB.size) 
    : 0;

  // Common prefix length
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);
  let commonPrefixLength = 0;
  const minLen = Math.min(normA.length, normB.length);
  while (commonPrefixLength < minLen && normA[commonPrefixLength] === normB[commonPrefixLength]) {
    commonPrefixLength++;
  }
  const prefixRatio = minLen > 0 ? commonPrefixLength / minLen : 0;

  // Dice bigram similarity
  const dice = bigramDiceSimilarity(normA, normB);

  // If both share >= 2 significant stems, or one stem set is almost a subset of the other
  const minStemsCount = Math.min(setA.size, setB.size);
  const subsetRatio = minStemsCount > 0 ? commonCount / minStemsCount : 0;

  // Weight composition
  let score = (stemJaccard * 0.40) + (tokenJaccard * 0.25) + (dice * 0.20) + (prefixRatio * 0.15);

  // Bonus for strong stem subset (e.g. "Рейки Flexi-Track 2 шт" and "Рейки Flexi-Track 4 шт")
  if (subsetRatio >= 0.7 && commonCount >= 2) {
    score = Math.max(score, 0.65 + (subsetRatio * 0.2));
  } else if (subsetRatio >= 0.6 && commonCount >= 2) {
    score = Math.max(score, 0.55 + (subsetRatio * 0.15));
  }

  // Bonus for common prefix of at least 8 characters
  if (commonPrefixLength >= 10) {
    score = Math.max(score, 0.60);
  }

  return Math.min(1.0, Math.max(0, score));
}

/**
 * Checks if two products are considered "дуже схожі за назвою" (very similar).
 * Threshold 0.46 ensures variations, sizes, quantities, and sibling models match,
 * while totally different products do not accidentally merge.
 */
export function areTitlesVerySimilar(titleA: string, titleB: string): boolean {
  const similarity = calculateTitleSimilarity(titleA, titleB);
  return similarity >= 0.46;
}

/**
 * Groups a list of products so that items with very similar titles are placed
 * right next to each other (adjacent), preserving the overall ranking order.
 *
 * How it works:
 * 1. Finds clusters of products connected by high title similarity (>= 0.46).
 * 2. Each cluster's display priority is determined by the best product in that cluster
 *    according to the current sorting order.
 * 3. Inside each cluster, items are chained by mutual similarity so variations appear side by side.
 * 4. The flattened list is returned with similar items grouped consecutively.
 */
export function groupSimilarProductsAdjacent<T extends { id: string; title: string; category?: string }>(
  products: T[],
  comparator?: (a: T, b: T) => number
): T[] {
  if (products.length <= 1) return [...products];

  // If a comparator is provided, pre-sort products to establish primary ranking
  const sorted = comparator ? [...products].sort(comparator) : [...products];

  // Adjacency matrix of similarity
  const n = sorted.length;
  const similarityMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    similarityMatrix[i][i] = 1.0;
    for (let j = i + 1; j < n; j++) {
      // Products in the same category or with general name overlap
      const sim = calculateTitleSimilarity(sorted[i].title, sorted[j].title);
      similarityMatrix[i][j] = sim;
      similarityMatrix[j][i] = sim;
    }
  }

  // Find connected components (clusters) of similar products
  const visited = new Set<number>();
  const clusters: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue;

    // Start a new cluster with product i
    const cluster: number[] = [i];
    visited.add(i);

    // Queue for BFS search of similar items
    const queue: number[] = [i];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (let j = 0; j < n; j++) {
        if (!visited.has(j)) {
          // Check similarity threshold
          if (similarityMatrix[current][j] >= 0.46) {
            visited.add(j);
            cluster.push(j);
            queue.push(j);
          }
        }
      }
    }

    // Inside the cluster, arrange items so that most similar pairs are contiguous
    if (cluster.length > 1) {
      const orderedCluster: number[] = [cluster[0]];
      const remaining = new Set(cluster.slice(1));

      while (remaining.size > 0) {
        const lastIdx = orderedCluster[orderedCluster.length - 1];
        let bestNext = -1;
        let highestSim = -1;

        for (const candidate of remaining) {
          const sim = similarityMatrix[lastIdx][candidate];
          if (sim > highestSim) {
            highestSim = sim;
            bestNext = candidate;
          }
        }

        if (bestNext !== -1) {
          orderedCluster.push(bestNext);
          remaining.delete(bestNext);
        } else {
          // Fallback
          const anyNext = remaining.values().next().value;
          if (anyNext !== undefined) {
            orderedCluster.push(anyNext);
            remaining.delete(anyNext);
          }
        }
      }

      clusters.push(orderedCluster);
    } else {
      clusters.push(cluster);
    }
  }

  // Flatten the clusters into the final ordered list
  const result: T[] = [];
  for (const cluster of clusters) {
    for (const idx of cluster) {
      result.push(sorted[idx]);
    }
  }

  return result;
}

/**
 * Finds sibling or very similar products to a target product,
 * sorted from most similar to least.
 */
export function findSimilarProducts<T extends { id: string; title: string }>(
  target: T,
  allProducts: T[],
  limit = 4
): { product: T; similarity: number }[] {
  return allProducts
    .filter(p => p.id !== target.id)
    .map(p => ({
      product: p,
      similarity: calculateTitleSimilarity(target.title, p.title)
    }))
    .filter(item => item.similarity >= 0.40)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
