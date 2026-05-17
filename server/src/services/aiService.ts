import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables including GROQ_API_KEY

let _groq: Groq | null = null;

function getGroqClient() {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.warn("⚠️ WARNING: GROQ_API_KEY is missing or using placeholder in .env!");
  }
  
  // Re-initialize if the key has changed or not yet initialized
  if (!_groq || (_groq as any).apiKey !== apiKey) {
    console.log(`[AI Service] Initializing Groq client (Key length: ${apiKey.length})`);
    _groq = new Groq({ apiKey: apiKey || 'missing_key' });
  }
  return _groq;
}

export async function generateAIQuestions(
  subject: string, 
  topic: string, 
  difficulty: string = 'Medium', 
  count: number = 5,
  context: string = '',
  standard: string = 'UG Level'
) {
  if (count <= 10) {
    return generateAIQuestionsBatch(subject, topic, difficulty, count, context, standard);
  }

  const BATCH_SIZE = 10;
  let remaining = count;
  const allQuestions: any[] = [];

  console.log(`[AI] Breaking down request of ${count} questions into batches of ${BATCH_SIZE} to avoid token/rate limits...`);

  while (remaining > 0) {
    const currentBatchSize = Math.min(remaining, BATCH_SIZE);
    console.log(`[AI] Generating batch of ${currentBatchSize} questions...`);
    try {
      const batchResult = await generateAIQuestionsBatch(subject, topic, difficulty, currentBatchSize, context, standard);
      allQuestions.push(...batchResult);
    } catch (err) {
      console.error(`[AI] Batch failed. Error:`, err);
      if (allQuestions.length === 0) throw err;
      break; // Return whatever we have generated so far
    }
    remaining -= currentBatchSize;

    if (remaining > 0) {
      // 3 second delay to avoid strict rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return allQuestions;
}

async function generateAIQuestionsBatch(
  subject: string, 
  topic: string, 
  difficulty: string = 'Medium', 
  count: number = 5,
  context: string = '',
  standard: string = 'UG Level'
) {
  try {
    const groq = getGroqClient();
    console.log(`[AI] Generating ${count} questions for ${subject} -> ${topic} (${difficulty})`);
    
    let groundingContext = '';
    let subjectStrictness = `0. ABSOLUTE SUBJECT STRICTNESS: Every single question must be strictly and exclusively about the Subject: "${subject}" and Topic: "${topic}". Do NOT generate questions about general knowledge or any other subject.`;

    if (context && context.trim().length > 10) {
      groundingContext = `\n\nGROUNDING CONTEXT (CRITICAL REQUIREMENT: You MUST generate questions strictly and exclusively from the facts, concepts, and material provided in this context below. Do NOT use outside knowledge):\n${context}\n\n`;
      subjectStrictness = `0. ABSOLUTE CONTEXT STRICTNESS: Every single question MUST be derived directly from the Grounding Context provided above. Do NOT generate questions from outside knowledge.`;
      console.log('[AI] Using syllabus grounding context.');
    }

    let difficultyGuidelines = `1. Conceptual Depth: Questions must test deep understanding, application of concepts, and analytical thinking. ABSOLUTELY NO trivial, direct, or "copy-paste" textbook questions. Every question must make the student think.
2. Trickiness & Traps: Options must be highly confusing. Include plausible distractors (wrong options) based on common student misconceptions.
3. Engaging Scenarios: Where possible, use real-world applications or case-based setups to make the questions highly engaging.`;

    if (difficulty === 'Hard') {
      difficultyGuidelines = `1. EXTREME DIFFICULTY: These questions must be insanely difficult, strictly matching the highest tier of the '${standard}' level (e.g., JEE Advanced, UPSC, GATE level). Require multi-step logical deduction, complex problem-solving, and deep analytical thought.
2. DEADLY TRAPS: Distractors MUST be cleverly crafted from highly common advanced mistakes. The correct answer should never be obvious.
3. ELITE LEVEL: Zero factual questions. Use complex scenarios, multiple-statement evaluation (1 and 2 only, etc.), assertion-reasoning, or advanced numericals.`;
    }

    const prompt = `You are a World-Class Elite Competitive Exam Setter and Master Coach for top-tier exams.
Your task is to craft ${count} MASTERPIECE, EXCEPTIONALLY HIGH-QUALITY, and completely original Multiple Choice Questions (MCQs) for the following:
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Standard/Level: ${standard}${groundingContext}

QUALITY & RIGOR REQUIREMENTS:
${subjectStrictness}
${difficultyGuidelines}
4. MAXIMUM VARIETY (CRITICAL): Ensure EVERY question covers a COMPLETELY DIFFERENT sub-concept, formula, or application pattern within the topic. Do NOT repeat the same type of question. Give maximum diversity.
5. Clarity & Precision: Phrasing must be unambiguous, academically rigorous, and grammatically perfect in both English and Hindi.
6. Absolute Accuracy: The correct answer MUST be indisputably correct. Explanations must be a masterclass, revealing the fastest shortcut trick along with the traditional method.
7. MATHEMATICAL & LOGICAL VERIFICATION (CRITICAL): Before finalizing the correct_answer, double check all mathematical calculations, equations, and logical deductions. Ensure that the option marked as correct_answer (a, b, c, or d) contains the exact, indisputably correct numerical value or factual statement. Do NOT put random numbers or mismatched options.

STRUCTURAL REQUIREMENTS:
1. Return EXACTLY ${count} questions.
2. Output MUST be a valid JSON array of objects.
3. Provide the English text in the main fields ("question", "option_a", etc.) and its EXACT Hindi translation in the corresponding "_hi" fields ("question_hi", "option_a_hi", etc.). Do NOT mix languages in the same field.
4. For options, use "option_a", "option_b", "option_c", "option_d".
5. Provide "correct_answer" as a single lowercase letter: "a", "b", "c", or "d".
6. Include "explanation" with step-by-step logic and shortcuts (this can be bilingual/Hinglish).
7. DO NOT RETURN THE PLACEHOLDER TEXT. YOU MUST GENERATE ACTUAL QUESTIONS.

JSON Format Example (REPLACE VALUES WITH YOUR ACTUAL GENERATED CONTENT):
{
  "questions": [
    {
    "question": "<Actual question text in English>",
    "question_hi": "<Actual question text in Hindi>",
    "option_a": "<Actual Option A text in English>",
    "option_a_hi": "<Actual Option A text in Hindi>",
    "option_b": "<Actual Option B text in English>",
    "option_b_hi": "<Actual Option B text in Hindi>",
    "option_c": "<Actual Option C text in English>",
    "option_c_hi": "<Actual Option C text in Hindi>",
    "option_d": "<Actual Option D text in English>",
    "option_d_hi": "<Actual Option D text in Hindi>",
    "correct_answer": "a",
    "explanation": "<Detailed step-by-step logic + 🚀 SHORTCUT TRICK (Bilingual EN/HI)>"
  }
  ]
}

Return ONLY the JSON object. Do not include conversational text or markdown code blocks around it. Ensure you generate EXACTLY ${count} questions before closing the JSON.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.35,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content || '[]';
    console.log(`[AI] Raw response received (${text.length} chars)`);
    
    try {
      let data = JSON.parse(text);
      if (data && typeof data === 'object' && !Array.isArray(data) && data.questions) {
        data = data.questions;
      }
      if (!Array.isArray(data)) {
        throw new Error('LLM did not return an array of questions.');
      }
      return data;
    } catch (parseError) {
      console.error('[AI] JSON Parse Failed. Cleaning text...');
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const start = cleanedText.indexOf('[');
      const end = cleanedText.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        try {
          let fallbackData = JSON.parse(cleanedText.substring(start, end + 1));
          if (fallbackData && typeof fallbackData === 'object' && !Array.isArray(fallbackData) && fallbackData.questions) {
            fallbackData = fallbackData.questions;
          }
          if (Array.isArray(fallbackData)) return fallbackData;
        } catch (e) {
          console.error('[AI] Fallback JSON parse also failed.');
        }
      }
      return []; // Return empty array instead of crashing so the system can gracefully handle it
    }
  } catch (error: any) {
    console.error('Groq Generation failed:', error);
    throw new Error('Failed to generate questions with AI');
  }
}

export async function generateAIExplanation(question: string, correctAnswer: string, options: any) {
  try {
    const groq = getGroqClient();
    console.log('[AI] Generating explanation for question...');
    
    const optionsText = typeof options === 'object' 
      ? Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(', ')
      : Array.isArray(options) ? options.join(', ') : String(options);

    const prompt = `You are a Master Educator and Elite Exam Coach. 
Provide a crystal-clear, deep-dive explanation for this competitive exam question.
Your explanation should feel like a "Eureka" moment for the student.

Question: ${question}
Options: ${optionsText}
Correct Answer: ${correctAnswer}

REQUIREMENTS:
1. Step-by-Step Logic: Break down the traditional method clearly.
2. Common Traps: Explain WHY the other popular options are wrong (misconceptions).
3. 🚀 BEST SHORTCUT TRICK: Provide a time-saving ninja technique, formula, or elimination method to solve this in 5-10 seconds (if applicable).
4. Language: Use a highly engaging, encouraging tone. Format in a mix of English and Hindi (Hinglish) for maximum relatability.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.35,
    });

    const result = completion.choices[0]?.message?.content || "No explanation generated.";
    return result;
  } catch (error: any) {
    console.error('Groq Explanation failed:', error);
    return `Maaf kijiye, abhi AI explanation generate nahi ho payi. Par sahi jawab "${correctAnswer}" hai. (Error: ${error.message})`;
  }
}

export const generateAIStudyPlan = async (performanceData: any) => {
  const groq = getGroqClient();
  const prompt = `Act as an expert exam coach. Analyze the following student performance data and provide a personalized 7-day study plan and strategic insights.
  Data: ${JSON.stringify(performanceData)}
  
  Format the response as a JSON object:
  {
    "insight": "General performance summary (Hinglish)",
    "prediction": "Future score/rank prediction",
    "plan": [
      { "day": 1, "topic": "Topic Name", "task": "What to do" }
    ],
    "mastery_path": "Next milestone details"
  }
  Keep it encouraging and actionable. Mix of Hindi and English.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Groq Study Plan failed:", error);
    return {
      insight: "AI temporary unavailable. Hume lagta hai aapko apne weak topics par dhyan dena chahiye.",
      prediction: "Keep practicing to see results.",
      plan: [{ day: 1, topic: "Revision", task: "Revise all weak topics" }],
      mastery_path: "Goal: 80% Accuracy"
    };
  }
};
