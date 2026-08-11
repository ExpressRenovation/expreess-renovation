
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const main = async () => {
    console.log("Listing models...");
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to instantiate
        // There isn't a direct listModels helper easily accessible on the instance without direct API call sometimes, 
        // but let's try the fetch approach which is raw but effective if the SDK doesn't expose it easily in this version.

        // Actually, let's just try to infer from error or documentation. 
        // But better: use the raw fetch to the API.

        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) throw new Error("No API Key");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            const fs = require('fs');
            let output = "Available Models:\n";
            data.models.forEach((m: any) => {
                const line = `- ${m.name} (${m.version}) [Methods: ${m.supportedGenerationMethods?.join(', ')}]`;
                console.log(line);
                output += line + "\n";
            });
            fs.writeFileSync('models_list.txt', output);
            console.log("Wrote models to models_list.txt");
        } else {
            console.error("Failed to list models:", data);
        }

    } catch (e) {
        console.error(e);
    }
};

main();
