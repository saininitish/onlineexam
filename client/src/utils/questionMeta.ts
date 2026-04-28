export type QuestionMeta = {
  text: string;     // Default/English text
  text_hi?: string;  // Hindi translation
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  chapter?: string;
};

export function serializeQuestion(text: string, topic?: string, difficulty?: string, chapter?: string, text_hi?: string): string {
  const meta: QuestionMeta = {
    text: text.trim(),
    text_hi: text_hi?.trim() || '',
    topic: topic?.trim() || 'General',
    difficulty: (difficulty?.trim() as QuestionMeta['difficulty']) || 'Medium',
    chapter: chapter?.trim() || ''
  };
  return JSON.stringify(meta);
}

export function parseQuestion(rawQuestion: string): QuestionMeta {
  if (!rawQuestion) return { text: '' };
  
  const trimmed = rawQuestion.trim();
  if (trimmed.startsWith('{') && trimmed.includes('"text":')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        text: parsed.text || '',
        text_hi: parsed.text_hi || '',
        topic: parsed.topic || 'General',
        difficulty: parsed.difficulty || 'Medium',
        chapter: parsed.chapter || ''
      };
    } catch {
      // fallback
    }
  }
  
  // Backward compatibility: If it's just a string, it might have a separator
  if (trimmed.includes('|||')) {
    const [en, hi] = trimmed.split('|||').map(s => s.trim());
    return { text: en, text_hi: hi, topic: 'General', difficulty: 'Medium', chapter: '' };
  }

  return {
    text: trimmed,
    topic: 'General',
    difficulty: 'Medium',
    chapter: ''
  };
}
