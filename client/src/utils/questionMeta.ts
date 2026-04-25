export type QuestionMeta = {
  text: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  chapter?: string;
};

export function serializeQuestion(text: string, topic?: string, difficulty?: string, chapter?: string): string {
  const meta = {
    text: text.trim(),
    topic: topic?.trim() || 'General',
    difficulty: difficulty?.trim() || 'Medium',
    chapter: chapter?.trim() || ''
  };
  return JSON.stringify(meta);
}

export function parseQuestion(rawQuestion: string): QuestionMeta {
  if (!rawQuestion) return { text: '' };
  
  if (rawQuestion.trim().startsWith('{"text":')) {
    try {
      return JSON.parse(rawQuestion);
    } catch (e) {
      // fallback
    }
  }
  
  // Backward compatibility for old questions
  return {
    text: rawQuestion,
    topic: 'General',
    difficulty: 'Medium',
    chapter: ''
  };
}
