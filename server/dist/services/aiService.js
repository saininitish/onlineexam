import Groq from "groq-sdk";
import dotenv from 'dotenv';
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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
        return chatCompletion.choices[0]?.message?.content || "";
    }
    catch (error) {
        console.error("Groq Explanation failed:", error);
        throw new Error("Failed to generate explanation with AI");
    }
};
