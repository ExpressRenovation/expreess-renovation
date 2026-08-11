
import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI, gemini } from '@genkit-ai/googleai';

const main = async () => {
    console.log("Testing gemini-2.5-flash...");

    // Initialize Genkit locally for this script
    const ai = genkit({
        plugins: [googleAI()],
    });

    const gemini25Flash = gemini('gemini-2.5-flash');

    try {
        const { text } = await ai.generate({
            model: gemini25Flash,
            prompt: 'Hello, are you working?',
        });
        console.log("Success! Response:", text);
    } catch (e) {
        console.error("Error generating content:", e);
    }
};

main();
