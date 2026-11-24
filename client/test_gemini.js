import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyD44q9DtOO6BeoH8tfbVRjFNH8idQeDiWo';
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Say hello");
    console.log("SUCCESS:", result.response.text());
  } catch (err) {
    console.log("Full error status:", JSON.stringify(err, null, 2));
    console.log("Error message:", err.message);
  }
}

main();
