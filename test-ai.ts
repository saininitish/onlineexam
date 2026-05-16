import { generateAIQuestions } from './server/src/services/aiService.ts';

async function run() {
  try {
    const q = await generateAIQuestions('Science', 'Physics', 'Medium', 2, '', 'UG Level');
    console.log(JSON.stringify(q, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
