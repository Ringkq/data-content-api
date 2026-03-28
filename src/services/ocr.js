const Tesseract = require('tesseract.js');

/**
 * OCR 服务 - 图片文字识别
 */
class OCRService {
  constructor() {
    this.languages = {
      'zh': 'chi_sim',
      'zh-traditional': 'chi_tra',
      'en': 'eng',
      'ja': 'jpn',
      'ko': 'kor'
    };
  }
  
  /**
   * 识别图片中的文字
   */
  async recognize(imageBuffer, options = {}) {
    const language = options.language || 'zh+en';
    const startTime = Date.now();
    
    try {
      // 处理语言代码
      const lang = this.parseLanguage(language);
      
      const result = await Tesseract.recognize(
        imageBuffer,
        lang,
        {
          logger: m => {
            if (options.debug) {
              console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      return {
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        words: result.data.words?.length || 0,
        language: lang,
        processingTime: (Date.now() - startTime) / 1000,
        blocks: result.data.paragraphs?.map(p => ({
          text: p.text,
          confidence: p.confidence,
          bbox: p.bbox
        })) || []
      };
      
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('图片识别失败: ' + error.message);
    }
  }
  
  /**
   * 解析语言代码
   */
  parseLanguage(langInput) {
    // 如果已经是我们需要的格式，直接返回
    if (langInput.includes('+') || langInput.length === 3) {
      return langInput;
    }
    
    // 转换简写
    const parts = langInput.split(',').map(l => {
      const lang = l.trim();
      return this.languages[lang] || lang;
    });
    
    return parts.join('+');
  }
  
  /**
   * 从 URL 识别图片
   */
  async recognizeFromUrl(url, options = {}) {
    const fetch = require('node-fetch');
    
    const response = await fetch(url, {
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.buffer();
    return this.recognize(buffer, options);
  }
}

module.exports = new OCRService();
