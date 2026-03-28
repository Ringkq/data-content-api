const express = require('express');
const router = express.Router();
const ocr = require('../services/ocr');

/**
 * POST /api/v1/ocr
 * 图片文字识别
 */
router.post('/ocr', async (req, res, next) => {
  try {
    const { language = 'zh+en' } = req.body;
    
    // 检查是否有文件上传
    if (!req.file && !req.body.image) {
      return res.status(400).json({
        success: false,
        error: '请上传图片文件或提供 base64 编码的图片数据',
        code: 'MISSING_IMAGE'
      });
    }
    
    let imageBuffer;
    
    if (req.file) {
      // 从文件获取
      imageBuffer = req.file.buffer;
    } else if (req.body.image) {
      // 从 base64 获取
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }
    
    // 执行 OCR
    const result = await ocr.recognize(imageBuffer, { language });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/ocr/url
 * 从 URL 识别图片
 */
router.post('/ocr/url', async (req, res, next) => {
  try {
    const { url, language = 'zh+en' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少 url 参数',
        code: 'MISSING_URL'
      });
    }
    
    // 从 URL 识别
    const result = await ocr.recognizeFromUrl(url, { language });
    
    res.json({
      success: true,
      data: {
        url,
        ...result
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/ocr/languages
 * 获取支持的 OCR 语言
 */
router.get('/ocr/languages', (req, res) => {
  res.json({
    success: true,
    data: {
      languages: [
        { code: 'zh', name: '中文（简体）', tesseract: 'chi_sim' },
        { code: 'zh-traditional', name: '中文（繁体）', tesseract: 'chi_tra' },
        { code: 'en', name: 'English', tesseract: 'eng' },
        { code: 'ja', name: '日本語', tesseract: 'jpn' },
        { code: 'ko', name: '한국어', tesseract: 'kor' }
      ],
      tip: '可以组合使用，如 "zh+en" 同时识别中英文'
    }
  });
});

module.exports = router;
