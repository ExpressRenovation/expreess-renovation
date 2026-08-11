
import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI, gemini } from '@genkit-ai/googleai';
import { readFileSync } from 'fs';
import { join } from 'path';

const main = async () => {
    console.log("Testing gemini-2.5-flash with PDF...");

    // Initialize Genkit locally for this script
    const ai = genkit({
        plugins: [googleAI()],
    });

    const gemini25Flash = gemini('gemini-2.5-flash');

    const pdfPath = join(process.cwd(), 'public', 'documents', '20250325_Mediciones_Alexandre_Rossello_23.pdf');
    console.log(`Reading PDF from: ${pdfPath}`);

    try {
        const pdfBuffer = readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        console.log(`PDF size: ${pdfBuffer.length} bytes`);

        const { text } = await ai.generate({
            model: gemini25Flash,
            prompt: [
                { text: 'Describe this document briefly.' },
                {
                    media: {
                        url: `data:application/pdf;base64,${pdfBase64}`,
                        contentType: 'application/pdf'
                    }
                }
            ],
        });
        console.log("Success! Response:", text);
    } catch (e) {
        console.error("Error generating content:", e);
    }
};

main();
