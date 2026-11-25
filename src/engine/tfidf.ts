/**
 * @file tfidf.ts
 * Pure deterministic TF-IDF vectorizer and Cosine Similarity engine (no ML library).
 * Features:
 *   - Lowercasing and tokenization
 *   - Unigrams + Bigrams extraction
 *   - Curated English stop-words filtration
 *   - Smoothed IDF: ln((1 + N) / (1 + df)) + 1
 *   - Sublinear TF: 1 + ln(tf) for tf > 0, 0 otherwise
 *   - L2-normalization for cosine similarity computation
 */

export const ENGLISH_STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'can', 'cannot', 'could', 'couldn', 'couldn\'t', 'd', 'did', 'didn', 'didn\'t',
  'do', 'does', 'doesn', 'doesn\'t', 'doing', 'don', 'don\'t', 'down', 'during', 'each', 'few',
  'for', 'from', 'further', 'had', 'hadn', 'hadn\'t', 'has', 'hasn', 'hasn\'t', 'have', 'haven',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve',
  'if', 'in', 'into', 'is', 'isn', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more',
  'most', 'mustn', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan',
  'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn', 'shouldn\'t', 'so', 'some',
  'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren', 'weren\'t', 'what', 'what\'s',
  'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why',
  'why\'s', 'with', 'won', 'won\'t', 'would', 'wouldn', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
]);

/**
 * Extracts unigrams and bigrams from a document, filtering out stop-words.
 * Formula:
 *   words = text.toLowerCase().match(/[a-z0-9+#.-]+/g)
 *   unigrams = words.filter(w => !stopwords.has(w) && w.length > 1)
 *   bigrams = for i in 0..words.length-2: `${words[i]}_${words[i+1]}`
 *
 * @param text Raw input document
 * @returns Array of token strings
 */
export function extractNGrams(text: string): string[] {
  if (!text) return [];
  const words = text.toLowerCase().match(/[a-z0-9+#.-]+/g) || [];
  const validTokens: string[] = [];

  // Filtered unigrams
  for (const w of words) {
    if (!ENGLISH_STOPWORDS.has(w) && w.length > 1) {
      validTokens.push(w);
    }
  }

  // Bigrams (only if neither is stopword)
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    if (!ENGLISH_STOPWORDS.has(w1) && !ENGLISH_STOPWORDS.has(w2)) {
      validTokens.push(`${w1}_${w2}`);
    }
  }

  return validTokens;
}

export interface TfIdfVectorModel {
  vocabulary: Map<string, number>; // token -> vocabIndex
  idf: number[]; // idf score per vocabIndex
  corpusSize: number;
}

/**
 * Fits a TF-IDF model on a corpus of documents.
 * Formula:
 *   N = corpus.length
 *   df(t) = count of documents in corpus containing term t
 *   smoothed IDF(t) = ln((1 + N) / (1 + df(t))) + 1
 *
 * @param corpus Array of document text strings
 * @returns Fitted vocabulary and IDF weights
 */
export function fitTfIdf(corpus: string[]): TfIdfVectorModel {
  const N = corpus.length;
  const docTokensList = corpus.map((doc) => new Set(extractNGrams(doc)));

  // Compute document frequency (df) for each unique token
  const dfMap = new Map<string, number>();
  for (const tokens of docTokensList) {
    for (const token of tokens) {
      dfMap.set(token, (dfMap.get(token) || 0) + 1);
    }
  }

  const vocabulary = new Map<string, number>();
  const idf: number[] = [];

  let idx = 0;
  for (const [token, df] of dfMap.entries()) {
    vocabulary.set(token, idx);
    // Smoothed IDF formula: ln((1 + N) / (1 + df)) + 1
    const smoothedIdf = Math.log((1 + N) / (1 + df)) + 1;
    idf.push(smoothedIdf);
    idx++;
  }

  return {
    vocabulary,
    idf,
    corpusSize: N,
  };
}

/**
 * Transforms a document into an L2-normalized TF-IDF vector.
 * Formula:
 *   sublinear TF(t) = tf > 0 ? (1 + ln(tf)) : 0
 *   weight(t) = sublinear TF(t) * IDF(t)
 *   L2-norm = sqrt( Σ(weight(t)^2) )
 *   vector(t) = weight(t) / L2-norm
 *
 * @param doc Text document
 * @param model Fitted TfIdfVectorModel
 * @returns Sparse or dense normalized weights map (vocabIndex -> normalized weight)
 */
export function transformDocument(doc: string, model: TfIdfVectorModel): Map<number, number> {
  const tokens = extractNGrams(doc);
  const tfMap = new Map<number, number>();

  for (const token of tokens) {
    const vocabIdx = model.vocabulary.get(token);
    if (vocabIdx !== undefined) {
      tfMap.set(vocabIdx, (tfMap.get(vocabIdx) || 0) + 1);
    }
  }

  const weightedVector = new Map<number, number>();
  let sumSquares = 0;

  for (const [vocabIdx, tf] of tfMap.entries()) {
    if (tf > 0) {
      // Sublinear TF: 1 + ln(tf)
      const sublinearTf = 1 + Math.log(tf);
      const tfidfWeight = sublinearTf * model.idf[vocabIdx];
      weightedVector.set(vocabIdx, tfidfWeight);
      sumSquares += tfidfWeight * tfidfWeight;
    }
  }

  const norm = Math.sqrt(sumSquares);
  if (norm === 0) return new Map();

  // L2 normalization
  const normalizedVector = new Map<number, number>();
  for (const [vocabIdx, weight] of weightedVector.entries()) {
    normalizedVector.set(vocabIdx, weight / norm);
  }

  return normalizedVector;
}

/**
 * Computes cosine similarity between two L2-normalized document vectors.
 * Formula:
 *   cosine_similarity = dot_product(vecA, vecB) = Σ (vecA[i] * vecB[i])
 * Output is naturally bounded between 0.0 and 1.0 (not rescaled).
 *
 * @param vecA First L2-normalized vector map
 * @param vecB Second L2-normalized vector map
 * @returns Cosine similarity number between 0 and 1
 */
export function computeCosineSimilarity(
  vecA: Map<number, number>,
  vecB: Map<number, number>
): number {
  if (vecA.size === 0 || vecB.size === 0) return 0;

  let dotProduct = 0;
  // Iterate through smaller map for efficiency
  const [smaller, larger] = vecA.size < vecB.size ? [vecA, vecB] : [vecB, vecA];

  for (const [idx, valA] of smaller.entries()) {
    const valB = larger.get(idx);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }

  // Bound within [0, 1] to prevent floating point drift
  return Math.max(0, Math.min(1, dotProduct));
}
