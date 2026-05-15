import Groq from "groq-sdk";
import dotenv from 'dotenv';
dotenv.config();
const apiKey = (process.env.GROQ_API_KEY || '').trim();
if (!apiKey) {
    console.warn("WARNING: GROQ_API_KEY is missing from environment variables!");
}
else {
    console.log(`[AI Service] API Key loaded: ${apiKey.substring(0, 10)}... (Length: ${apiKey.length})`);
}
const groq = new Groq({ apiKey: apiKey || 'missing_key' });
export const generateAIQuestions = async (subject, topic, difficulty, count = 5, context = '', standard = 'UG Level') => {
    const prompt = `Act as an expert examiner and competitive coach for the subject: ${subject}.
  Generate ${count} multiple choice questions strictly related to the topic: ${topic}.
  
  EXAM LEVEL: ${standard} (Tailor the depth and complexity of questions to this level).
  
  ${context ? `SYLLABUS CONTEXT (Follow this strictly):
  ${context}` : `STRICT CONTEXT: The questions must be academically relevant to ${subject} only.`}
  
  Example: If subject is "Mathematics" and topic is "Number System", focus on Divisibility, Primes, HCF/LCM, etc. Do NOT include Binary/Hexadecimal (Computer Science) unless the subject is "Computer Science".
  
  Difficulty: ${difficulty}
  
  IMPORTANT: Provide both English and Hindi versions for each question and its options.
  
  Return ONLY a JSON array of objects with this structure:
  [
    {
      "question": "Question text here (English)",
      "question_hi": "प्रश्न यहाँ लिखे (Hindi)",
      "option_a": "Option text (English)",
      "option_a_hi": "विकल्प पाठ (Hindi)",
      "option_b": "Option text (English)",
      "option_b_hi": "विकल्प पाठ (Hindi)",
      "option_c": "Option text (English)",
      "option_c_hi": "विकल्प पाठ (Hindi)",
      "option_d": "Option text (English)",
      "option_d_hi": "विकल्प पाठ (Hindi)",
      "correct_answer": "a/b/c/d",
      "topic": "${topic}",
      "difficulty": "${difficulty}"
    }
  ]
  Do not include markdown formatting or extra text.`;
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });
        const text = chatCompletion.choices[0]?.message?.content || "";
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
    }
    catch (error) {
        console.error("Groq Generation failed:", error);
        throw new Error("Failed to generate questions with AI");
    }
};
export const generateAIExplanation = async (question, correctAnswer, options) => {
    const prompt = `Act as a competitive exam coach (Expert in SSC, UPSC, JEE, etc.). Provide the BEST SHORTCUT TRICK and a step-by-step solution for the following question.
  
  Question: ${question}
  Options:
  a: ${options.a}
  b: ${options.b}
  c: ${options.c}
  d: ${options.d}
  
  Format your response strictly as follows:
  
  🚀 BEST SHORTCUT TRICK:
  [Provide a 10-second mental math trick, shortcut, or formula to solve this instantly for exams]
  
  📝 STEP-BY-STEP SOLUTION:
  Step 1: [Core concept/Basic logic]
  Step 2: [Apply logic or simple calculation]
  Step 3: [Confirmation of answer "${correctAnswer}"]
  
  💡 KEY POINTS & FORMULAS:
  • [Point 1: Must-know formula or fact]
  • [Point 2: Common mistake to avoid]
  
  Language: Friendly Hinglish (Hindi + English). 
  Tone: Highly energetic and coaching-oriented. Focus on speed and accuracy.`;
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
        });
        return chatCompletion.choices[0]?.message?.content || "AI explanation temporarily unavailable.";
    }
    catch (error) {
        console.error("Groq Explanation failed:", error);
        // Provide a helpful fallback instead of throwing
        return `Maaf kijiye, abhi AI explanation generate nahi ho payi. Par sahi jawab "${correctAnswer}" hai. (Error: ${error.message})`;
    }
};
export const generateAIStudyPlan = async (performanceData) => {
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
    }
    catch (error) {
        console.error("Groq Study Plan failed:", error);
        // Return a basic fallback plan if AI fails
        return {
            insight: "AI temporary unavailable. Hume lagta hai aapko apne weak topics par dhyan dena chahiye.",
            prediction: "Keep practicing to see results.",
            plan: [{ day: 1, topic: "Revision", task: "Revise all weak topics" }],
            mastery_path: "Goal: 80% Accuracy"
        };
    }
};
