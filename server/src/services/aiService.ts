import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

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
  try {
    const groq = getGroqClient();
    console.log(`[AI] Generating ${count} questions for ${subject} -> ${topic} (${difficulty})`);
    
    let groundingContext = '';
    if (context && context.trim().length > 10) {
      groundingContext = `\n\nGROUNDING CONTEXT (Only generate questions based on this material):\n${context}\n\n`;
      console.log('[AI] Using syllabus grounding context.');
    }

    const prompt = `You are a Competitive Exam Coach.
Generate ${count} highly accurate MCQ questions for the following:
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Standard/Level: ${standard}${groundingContext}

REQUIREMENTS:
1. Return EXACTLY ${count} questions.
2. For each question, provide 4 options (A, B, C, D).
3. Include the correct answer (A, B, C, or D) and a detailed step-by-step explanation.
4. If this is a math or science topic, prioritize shortcut tricks and logical steps in the explanation.
5. Use BOTH English and Hindi for the question text and options if possible (e.g. "What is 2+2? / 2+2 क्या है?").
6. Output MUST be a valid JSON array of objects.

JSON Format:
[
  {
    "question": "Question text in EN/HI",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "A",
    "explanation": "Detailed step-by-step explanation with shortcuts"
  }
]

Return ONLY the JSON array. No conversational text.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content || '[]';
    
    try {
      let data = JSON.parse(text);
      if (!Array.isArray(data) && data.questions) {
        data = data.questions;
      }
      return data;
    } catch (parseError) {
      console.error('[AI] JSON Parse Failed. Cleaning text...');
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const start = cleanedText.indexOf('[');
      const end = cleanedText.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        return JSON.parse(cleanedText.substring(start, end + 1));
      }
      throw parseError;
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

    const prompt = `Explain this question for a competitive exam student. 
Provide a step-by-step logical breakdown and any short-cut tricks if applicable.
Question: ${question}
Options: ${optionsText}
Correct Answer: ${correctAnswer}

Format your response in a clear, educational way. Use both English and Hindi.
Include a section "🚀 BEST SHORTCUT TRICK" if applicable.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
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
      temperature: 0.6,
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
