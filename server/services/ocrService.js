const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class OCRService {
  constructor() {
    this.supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    this.supportedPdfTypes = ['application/pdf'];
  }

  /**
   * Process receipt file and extract text using OCR
   * @param {string} filePath - Path to the uploaded file
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<string>} Extracted text from the receipt
   */
  async extractText(filePath, mimeType) {
    try {
      if (this.supportedImageTypes.includes(mimeType)) {
        return await this.extractTextFromImage(filePath);
      } else if (this.supportedPdfTypes.includes(mimeType)) {
        return await this.extractTextFromPDF(filePath);
      } else {
        throw new Error('Unsupported file type for OCR');
      }
    } catch (error) {
      console.error('OCR text extraction failed:', error);
      throw new Error('Failed to extract text from receipt');
    }
  }

  /**
   * Extract text from image files using Tesseract.js
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<string>} Extracted text
   */
  async extractTextFromImage(imagePath) {
    try {
      // Preprocess image for better OCR accuracy
      const processedImagePath = await this.preprocessImage(imagePath);
      
      const { data: { text } } = await Tesseract.recognize(
        processedImagePath,
        'eng',
        {
          logger: m => console.log('OCR Progress:', m)
        }
      );

      // Clean up processed image
      await this.cleanupTempFile(processedImagePath);

      return text.trim();
    } catch (error) {
      console.error('Image OCR failed:', error);
      throw error;
    }
  }

  /**
   * Extract text from PDF files
   * @param {string} pdfPath - Path to the PDF file
   * @returns {Promise<string>} Extracted text
   */
  async extractTextFromPDF(pdfPath) {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdfParse(dataBuffer);
      return data.text.trim();
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess image to improve OCR accuracy
   * @param {string} imagePath - Path to the original image
   * @returns {Promise<string>} Path to the processed image
   */
  async preprocessImage(imagePath) {
    try {
      const processedPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
      
      await sharp(imagePath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: false })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toFile(processedPath);

      return processedPath;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return imagePath; // Return original if preprocessing fails
    }
  }

  /**
   * Clean up temporary files
   * @param {string} filePath - Path to the file to delete
   */
  async cleanupTempFile(filePath) {
    try {
      if (filePath.includes('_processed') && await fs.access(filePath).then(() => true).catch(() => false)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error('Failed to cleanup temp file:', error);
    }
  }

  /**
   * Parse extracted text to identify expense data
   * @param {string} text - Raw text from OCR
   * @returns {Object} Parsed expense data
   */
  parseReceiptText(text) {
    const parsedData = {
      description: '',
      amount: null,
      currency: 'USD',
      expenseDate: null,
      merchant: '',
      confidence: 0
    };

    try {
      // Extract amount (look for currency patterns)
      const amountPatterns = [
        /(?:total|amount|sum|price)[\s:]*\$?(\d+\.?\d*)/i,
        /\$(\d+\.?\d*)/,
        /(\d+\.?\d*)\s*(?:USD|EUR|GBP|INR|CAD|AUD)/i,
        /(\d+\.?\d*)\s*[€£₹$]/,
        /total[\s:]*(\d+\.?\d*)/i
      ];

      for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match) {
          parsedData.amount = parseFloat(match[1]);
          parsedData.confidence += 20;
          break;
        }
      }

      // Extract currency
      const currencyPatterns = [
        /(USD|EUR|GBP|INR|CAD|AUD)/i,
        /[€£₹$]/
      ];

      for (const pattern of currencyPatterns) {
        const match = text.match(pattern);
        if (match) {
          if (match[1]) {
            parsedData.currency = match[1].toUpperCase();
          } else if (match[0] === '€') {
            parsedData.currency = 'EUR';
          } else if (match[0] === '£') {
            parsedData.currency = 'GBP';
          } else if (match[0] === '₹') {
            parsedData.currency = 'INR';
          } else if (match[0] === '$') {
            parsedData.currency = 'USD';
          }
          parsedData.confidence += 15;
          break;
        }
      }

      // Extract date
      const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
        /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i
      ];

      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          try {
            const dateStr = match[1] || match[0];
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              parsedData.expenseDate = date.toISOString().split('T')[0];
              parsedData.confidence += 15;
              break;
            }
          } catch (e) {
            // Continue to next pattern
          }
        }
      }

      // Extract merchant/business name (usually at the top)
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        // First non-empty line is often the merchant name
        parsedData.merchant = lines[0].trim();
        parsedData.description = parsedData.merchant;
        parsedData.confidence += 10;
      }

      // Extract description from common patterns
      const descriptionPatterns = [
        /(?:item|product|service)[\s:]*([^\n]+)/i,
        /(?:description|details)[\s:]*([^\n]+)/i
      ];

      for (const pattern of descriptionPatterns) {
        const match = text.match(pattern);
        if (match && match[1].trim().length > 3) {
          parsedData.description = match[1].trim();
          parsedData.confidence += 10;
          break;
        }
      }

      // If no specific description found, use merchant name
      if (!parsedData.description && parsedData.merchant) {
        parsedData.description = parsedData.merchant;
      }

      // Determine category based on keywords
      parsedData.category = this.determineCategory(text);

      // Cap confidence at 100
      parsedData.confidence = Math.min(parsedData.confidence, 100);

    } catch (error) {
      console.error('Receipt parsing failed:', error);
    }

    return parsedData;
  }

  /**
   * Determine expense category based on text content
   * @param {string} text - Receipt text
   * @returns {string} Category name
   */
  determineCategory(text) {
    const categoryKeywords = {
      'Food': ['restaurant', 'food', 'meal', 'dining', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'sandwich'],
      'Travel': ['taxi', 'uber', 'lyft', 'flight', 'airline', 'hotel', 'booking', 'travel', 'trip'],
      'Accommodation': ['hotel', 'motel', 'airbnb', 'lodging', 'accommodation', 'stay'],
      'Transportation': ['gas', 'fuel', 'parking', 'metro', 'bus', 'train', 'transport', 'toll'],
      'Office Supplies': ['office', 'supplies', 'stationery', 'paper', 'pen', 'notebook', 'stapler'],
      'Entertainment': ['movie', 'cinema', 'theater', 'entertainment', 'game', 'concert', 'show'],
      'Miscellaneous': []
    };

    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return category;
        }
      }
    }

    return 'Miscellaneous';
  }

  /**
   * Process receipt file and return structured expense data
   * @param {string} filePath - Path to the uploaded file
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<Object>} Structured expense data
   */
  async processReceipt(filePath, mimeType) {
    try {
      console.log('Starting OCR processing for:', filePath);
      
      // Extract text from receipt
      const extractedText = await this.extractText(filePath, mimeType);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the receipt');
      }

      console.log('Extracted text:', extractedText.substring(0, 200) + '...');

      // Parse the extracted text
      const parsedData = this.parseReceiptText(extractedText);
      
      // Add raw text for debugging
      parsedData.rawText = extractedText;

      console.log('Parsed data:', parsedData);

      return parsedData;
    } catch (error) {
      console.error('Receipt processing failed:', error);
      throw error;
    }
  }
}

module.exports = new OCRService();
