/**
 * Name Normalization & Fuzzy Similarity Matcher
 * Handles Indian name formats, initials, capitalization differences, and punctuation.
 */

export interface NameMatchResult {
  studentName: string;
  extractedName: string;
  normalizedStudent: string;
  normalizedExtracted: string;
  matchScore: number; // 0 to 100
  status: 'MATCHED' | 'MISMATCH';
  recommendation: 'Matched' | 'Needs Staff Review';
  reason: string;
}

export function normalizeName(name: string): string {
  if (!name) return '';
  
  let normalized = name
    .toLowerCase()
    .trim()
    // Remove honorifics/titles
    .replace(/\b(master|miss|kumari|selvan|selvi|mr|mrs|shri|sri|dr)\b\.?/gi, '')
    // Remove all punctuation (dots, commas, hyphens, slashes, brackets)
    .replace(/[.,\-_/\\()[\]{}:;'"!@#$%^&*]/g, ' ')
    // Normalize multiple spaces to a single space
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * Compute Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: an + 1 }, () => Array(bn + 1).fill(0));

  for (let i = 0; i <= an; i++) matrix[i][0] = i;
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[an][bn];
}

/**
 * Token-based match score to handle inverted initials (e.g. "Karthick S" vs "S Karthick")
 */
function tokenSimilarity(s1: string, s2: string): number {
  const tokens1 = s1.split(' ').filter(Boolean);
  const tokens2 = s2.split(' ').filter(Boolean);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // Check if all tokens of s1 exist in s2 or vice versa
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  // Exact token set equality
  if (tokens1.length === tokens2.length && tokens1.every(t => set2.has(t))) {
    return 1.0;
  }

  // Count matching tokens
  let matchingCount = 0;
  for (const t1 of tokens1) {
    if (set2.has(t1)) {
      matchingCount++;
    } else {
      // Check partial single-letter initial match
      const initialMatch = tokens2.some(t2 => (t1.length === 1 && t2.startsWith(t1)) || (t2.length === 1 && t1.startsWith(t2)));
      if (initialMatch) {
        matchingCount += 0.85;
      }
    }
  }

  const tokenScore = (2 * matchingCount) / (tokens1.length + tokens2.length);
  return Math.min(1.0, tokenScore);
}

/**
 * Compare student name with OCR extracted name
 */
export function compareNames(studentName: string, extractedName: string): NameMatchResult {
  const normStudent = normalizeName(studentName);
  const normExtracted = normalizeName(extractedName);

  if (!normStudent || !normExtracted) {
    return {
      studentName,
      extractedName,
      normalizedStudent: normStudent,
      normalizedExtracted: normExtracted,
      matchScore: 0,
      status: 'MISMATCH',
      recommendation: 'Needs Staff Review',
      reason: 'Name was missing or could not be extracted from the document.'
    };
  }

  // 1. Exact normalized match
  if (normStudent === normExtracted) {
    return {
      studentName,
      extractedName,
      normalizedStudent: normStudent,
      normalizedExtracted: normExtracted,
      matchScore: 100,
      status: 'MATCHED',
      recommendation: 'Matched',
      reason: 'Exact match after standard normalization.'
    };
  }

  // 2. Token order & initials similarity
  const tokenScore = tokenSimilarity(normStudent, normExtracted);

  // 3. String edit distance similarity
  const maxLen = Math.max(normStudent.length, normExtracted.length);
  const dist = levenshteinDistance(normStudent, normExtracted);
  const editScore = maxLen === 0 ? 1 : 1 - dist / maxLen;

  // Composite weighted score (giving high weight to token reordering/initials)
  const compositeScore = Math.max(tokenScore * 0.95, editScore * 0.9, (tokenScore * 0.6 + editScore * 0.4));
  const finalPercentage = Math.round(compositeScore * 100);

  const isMatched = finalPercentage >= 85;

  let reason = '';
  if (finalPercentage >= 95) {
    reason = 'High confidence name match (initials / token ordering matched).';
  } else if (finalPercentage >= 85) {
    reason = 'Slight variation in spelling or initial formatting, within acceptable threshold.';
  } else if (finalPercentage >= 60) {
    reason = 'Partial name match detected. Manual staff verification required.';
  } else {
    reason = 'Significant name mismatch between certificate and student record.';
  }

  return {
    studentName,
    extractedName,
    normalizedStudent: normStudent,
    normalizedExtracted: normExtracted,
    matchScore: finalPercentage,
    status: isMatched ? 'MATCHED' : 'MISMATCH',
    recommendation: isMatched ? 'Matched' : 'Needs Staff Review',
    reason
  };
}
