
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testGeminiRAG() {
    const apiKey = process.env.GEMINI_API_KEY;
    const storeName = process.env.FILE_SEARCH_STORE_NAME;

    console.log('Store Name:', storeName);

    const ai = new GoogleGenAI({ apiKey });

    const tools = storeName ? [
        {
            fileSearch: {
                fileSearchStoreNames: [storeName]
            }
        }
    ] : [];

    try {
        console.log('Testing RAG with gemini-2.5-flash...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'Hello, who is Vickie?' }] }],
            config: {
                tools
            }
        });
        console.log('Success (RAG):', response.text);
    } catch (error) {
        console.error('Error with RAG:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
    }
}

testGeminiRAG();
