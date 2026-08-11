
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// The project uses a fork of pdf-parse where it exports { PDFParse } class via CommonJS
// We mimic exactly what RegexPriceBookParser does
const { PDFParse } = require('pdf-parse');

const main = async () => {
    const pdfPath = 'public/documents/Libro Precios 46_COAATMCA.pdf';
    console.log(`Reading PDF: ${pdfPath}`);

    try {
        const dataBuffer = fs.readFileSync(pdfPath);

        // Instantiate parser with buffer
        const parser = new PDFParse({ data: dataBuffer });

        console.log("Extracting text...");
        // API seems to be .getText() based on RegexPriceBookParser
        const data = await parser.getText();

        console.log(`\nText Length: ${data.text.length}`);

        console.log('--- START SAMPLE TEXT (First 3000 chars) ---');
        console.log(data.text.substring(0, 3000));
        console.log('--- END SAMPLE TEXT ---');

        // Extract a random middle chunk too to see items
        const middle = Math.floor(data.text.length / 2);
        console.log('--- MIDDLE SAMPLE TEXT ---');
        console.log(data.text.substring(middle, middle + 1000));
        console.log('--- END MIDDLE SAMPLE TEXT ---');

        fs.writeFileSync('pdf_sample.txt', data.text);

    } catch (e) {
        console.error("Error reading PDF:", e);
    }
}

main();
