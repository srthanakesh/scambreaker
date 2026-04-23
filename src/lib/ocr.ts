import Tesseract from 'tesseract.js';

export async function extractTextFromFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ text: string; confidence: number }> {
  try {
    if (file.type.includes('pdf')) {
      return await extractTextFromPdf(file, onProgress);
    } else if (file.type.includes('image')) {
      return await extractTextFromImage(file, onProgress);
    } else {
      throw new Error('Unsupported file type. Please upload an image or PDF.');
    }
  } catch (error) {
    console.error('OCR Extraction Error:', error);
    throw error;
  }
}

async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ text: string; confidence: number }> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const worker = await Tesseract.createWorker('eng+msa+chi_sim+tam', 1, {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });
    
    const { data: { text, confidence } } = await worker.recognize(imageUrl);
    await worker.terminate();

    return { text, confidence };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ text: string; confidence: number }> {
  // Dynamically import pdfjs to avoid SSR issues like DOMMatrix not defined
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  
  let fullText = '';
  let totalConfidence = 0;
  const numPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Could not create canvas context');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    } as any).promise;

    const dataUrl = canvas.toDataURL('image/png');
    
    // Process this page with Tesseract
    const worker = await Tesseract.createWorker('eng+msa+chi_sim+tam', 1, {
      logger: m => {
        if (m.status === 'recognizing text' && onProgress) {
          // Calculate overall progress across all pages
          const baseProgress = ((pageNum - 1) / numPages) * 100;
          const pageProgress = (m.progress * 100) / numPages;
          onProgress(Math.round(baseProgress + pageProgress));
        }
      }
    });
    
    const { data: { text, confidence } } = await worker.recognize(dataUrl);
    await worker.terminate();

    fullText += text + '\n\n';
    totalConfidence += confidence;
  }

  return {
    text: fullText.trim(),
    confidence: numPages > 0 ? totalConfidence / numPages : 0
  };
}
