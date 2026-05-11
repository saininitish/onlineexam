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
export const generateAIQuestions = async (topic, difficulty, count = 5) => {
    const prompt = `Generate ${count} multiple choice questions for a mock exam.
  Topic: ${topic}
  Difficulty: ${difficulty}
  
  Return ONLY a JSON array of objects with this structure:
  [
    {
      "question": "Question text here",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
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
    const prompt = `Explain why the correct answer is "${correctAnswer}" for the following question:
  Question: ${question}
  Options:
  a: ${options.a}
  b: ${options.b}
  c: ${options.c}
  d: ${options.d}
  
  Provide a clear, concise explanation in simple language (mix of Hindi and English). Keep it under 150 words.`;
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
