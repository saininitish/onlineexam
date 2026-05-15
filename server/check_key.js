import dotenv from 'dotenv';
dotenv.config();
const key = process.env.GROQ_API_KEY;
console.log('Key length:', key?.length);
console.log('Key value:', JSON.stringify(key));
if (key && key.includes(' ')) {
  console.log('Key contains spaces!');
}
