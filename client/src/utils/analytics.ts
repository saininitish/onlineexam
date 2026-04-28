export function autoDetectTopic(questionText: string): string {
  const q = questionText.toLowerCase();
  if (/(database|sql|nosql|mongo|postgres|table|query|rdbms|dbms)/.test(q)) return 'Database';
  if (/(html|css|flexbox|grid|dom|margin|padding|style|bootstrap)/.test(q)) return 'Frontend Web';
  if (/(react|component|hook|jsx|props|state|redux)/.test(q)) return 'React';
  if (/(node|express|api|backend|server|http|rest)/.test(q)) return 'Backend';
  if (/(java|python|c\+\+|c#|variable|loop|array|function|class|object|string|integer|boolean)/.test(q)) return 'Programming Fundamentals';
  if (/(math|calculate|sum|multiply|divide|equation|\+|-|\*)/.test(q)) return 'Mathematics';
  if (/(capital|country|city|president|river|mountain|history|war)/.test(q)) return 'General Knowledge';
  if (/(physics|chemistry|biology|science|atom|cell|energy|force)/.test(q)) return 'Science';
  return 'General';
}

export function autoDetectDifficulty(questionText: string): 'Easy' | 'Medium' | 'Hard' {
  const len = questionText.length;
  const q = questionText.toLowerCase();
  
  // Heuristic based on complexity markers
  const hasCode = /[{}[\]();=]/.test(q);
  const hasMultipleConditions = (q.match(/(if|when|which of|assuming)/g) || []).length >= 2;
  
  if (len > 150 || (hasCode && hasMultipleConditions)) return 'Hard';
  if (len > 70 || hasCode || q.includes('what is the output') || q.includes('which of the following')) return 'Medium';
  return 'Easy';
}
