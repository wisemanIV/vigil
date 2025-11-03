import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.js');

class FileParser {
    constructor() {
        this.ocrWorker = null;
    }
    
    async parseFile(file) {
        console.log(`Parsing file: ${file.name} (${file.type})`);
        
        const fileType = this.getFileType(file);
        
        switch (fileType) {
            case 'pdf':
                return await this.parsePDF(file);
            case 'docx':
                return await this.parseDOCX(file);
            case 'xlsx':
            case 'csv':
                return await this.parseSpreadsheet(file);
            case 'txt':
                return await this.parseText(file);
            case 'image':
                return await this.parseImage(file);
            default:
                return {
                    text: '',
                    metadata: { type: fileType, error: 'Unsupported file type' }
                };
        }
    }
    
    getFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const mimeType = file.type.toLowerCase();
        
        // PDF
        if (extension === 'pdf' || mimeType === 'application/pdf') {
            return 'pdf';
        }
        
        // Word documents
        if (extension === 'docx' || 
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return 'docx';
        }
        
        // Excel/CSV
        if (extension === 'xlsx' || extension === 'xls' || extension === 'csv' ||
            mimeType.includes('spreadsheet') || mimeType === 'text/csv') {
            return extension === 'csv' ? 'csv' : 'xlsx';
        }
        
        // Text files
        if (extension === 'txt' || mimeType === 'text/plain') {
            return 'txt';
        }
        
        // Images
        if (mimeType.startsWith('image/')) {
            return 'image';
        }
        
        return 'unknown';
    }
    
    async parsePDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            const metadata = {
                type: 'pdf',
                pages: pdf.numPages,
                title: (await pdf.getMetadata()).info?.Title || ''
            };
            
            // Extract text from each page
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            return {
                text: fullText,
                metadata: metadata
            };
            
        } catch (error) {
            console.error('PDF parsing failed:', error);
            return {
                text: '',
                metadata: { type: 'pdf', error: error.message }
            };
        }
    }
    
    async parseDOCX(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            
            return {
                text: result.value,
                metadata: {
                    type: 'docx',
                    warnings: result.messages
                }
            };
            
        } catch (error) {
            console.error('DOCX parsing failed:', error);
            return {
                text: '',
                metadata: { type: 'docx', error: error.message }
            };
        }
    }
    
    async parseSpreadsheet(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            let fullText = '';
            const sheets = [];
            
            // Extract text from all sheets
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const sheetText = XLSX.utils.sheet_to_csv(sheet);
                fullText += `\n--- ${sheetName} ---\n${sheetText}\n`;
                sheets.push(sheetName);
            });
            
            return {
                text: fullText,
                metadata: {
                    type: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
                    sheets: sheets
                }
            };
            
        } catch (error) {
            console.error('Spreadsheet parsing failed:', error);
            return {
                text: '',
                metadata: { type: 'xlsx', error: error.message }
            };
        }
    }
    
    async parseText(file) {
        try {
            const text = await file.text();
            
            return {
                text: text,
                metadata: {
                    type: 'txt',
                    size: file.size
                }
            };
            
        } catch (error) {
            console.error('Text parsing failed:', error);
            return {
                text: '',
                metadata: { type: 'txt', error: error.message }
            };
        }
    }
    
    async parseImage(file) {
        try {
            // Initialize OCR worker if not already initialized
            if (!this.ocrWorker) {
                this.ocrWorker = await createWorker('eng');
            }
            
            // Convert file to data URL
            const dataUrl = await this.fileToDataURL(file);
            
            // Perform OCR
            const { data: { text } } = await this.ocrWorker.recognize(dataUrl);
            
            return {
                text: text,
                metadata: {
                    type: 'image',
                    mimeType: file.type,
                    hasText: text.trim().length > 0
                }
            };
            
        } catch (error) {
            console.error('Image OCR failed:', error);
            return {
                text: '',
                metadata: { type: 'image', error: error.message }
            };
        }
    }
    
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    async cleanup() {
        if (this.ocrWorker) {
            await this.ocrWorker.terminate();
            this.ocrWorker = null;
        }
    }
}

export default FileParser;
