
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker to use a CDN to avoid Vite/Webpack bundling issues with the worker file.
// Using the version matching the installed package is best, but for now we pick a recent stable one.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Extracts text content from a PDF file.
 * @param source - Can be a File object (client-side upload) or a URL string (server/storage url).
 */
export const getTextFromPDF = async (source: File | string): Promise<string> => {
    try {
        let loadingTask;

        if (source instanceof File) {
            const arrayBuffer = await source.arrayBuffer();
            loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        } else {
            // It's a URL
            loadingTask = pdfjsLib.getDocument(source);
        }

        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }

        return fullText.trim();
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to extract text from PDF document.");
    }
};
