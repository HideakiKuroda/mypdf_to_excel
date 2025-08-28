export const isValidLine = (line: string): boolean => {
  // 1. Contains digits
  const hasDigit = /\d/.test(line);

  // 2. Contains both Japanese and English
  const hasJapanese = /[\u3040-\u30FF\u4E00-\u9FFF\uFF66-\uFF9F]/.test(line);
  const hasEnglish = /[A-Za-z]/.test(line);
  const hasJapaneseAndEnglish = hasJapanese && hasEnglish;

  // 3. Contains special characters (except common punctuations)
  const hasSpecialChar = /[!@#$%^&*()_+=[\]{};:"\\|<>\/~`]/.test(line);

  // 4. Contains forbidden words
  const hasForbiddenWord = /(なし|未定|BAY)/.test(line);

  // 5. Contains both full-width and half-width Japanese
  const hasFullWidthKana = /[\u30A0-\u30FF]/.test(line); // Katakana
  const hasHalfWidthKana = /[\uFF61-\uFF9F]/.test(line); // Half-width katakana
  const mixesFullAndHalfWidthKana = hasFullWidthKana && hasHalfWidthKana;

  return !(hasDigit || hasJapaneseAndEnglish || hasSpecialChar || hasForbiddenWord || mixesFullAndHalfWidthKana);
};
