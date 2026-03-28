const express = require('express');
const router = express.Router();
const ai = require('../services/ai');

/**
 * POST /api/v1/translate
 * 多语言翻译
 */
router.post('/translate', async (req, res, next) => {
  try {
    const { text, source = 'auto', target = 'zh' } = req.body;
    
    // 参数验证
    if (!text) {
      return res.status(400).json({
        success: false,
        error: '缺少 text 参数',
        code: 'MISSING_TEXT'
      });
    }
    
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: '文本长度不能超过 5000 字符',
        code: 'TEXT_TOO_LONG'
      });
    }
    
    // 执行翻译
    const translation = await ai.translate(text, source, target);
    
    res.json({
      success: true,
      data: {
        original: text,
        translation,
        source,
        target,
        originalLength: text.length,
        translationLength: translation.length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/translate/batch
 * 批量翻译
 */
router.post('/translate/batch', async (req, res, next) => {
  try {
    const { texts, source = 'auto', target = 'zh' } = req.body;
    
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少 texts 参数或格式无效',
        code: 'INVALID_TEXTS'
      });
    }
    
    if (texts.length > 10) {
      return res.status(400).json({
        success: false,
        error: '一次最多翻译 10 条文本',
        code: 'TOO_MANY_TEXTS'
      });
    }
    
    // 并发翻译
    const results = await Promise.allSettled(
      texts.map(text => ai.translate(text, source, target))
    );
    
    const data = results.map((result, index) => ({
      index,
      original: texts[index],
      success: result.status === 'fulfilled',
      translation: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
    
    res.json({
      success: true,
      data,
      source,
      target,
      summary: {
        total: texts.length,
        successful: data.filter(d => d.success).length,
        failed: data.filter(d => !d.success).length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/translate/languages
 * 获取支持的语言列表
 */
router.get('/translate/languages', (req, res) => {
  res.json({
    success: true,
    data: {
      languages: [
        { code: 'zh', name: '中文（简体）' },
        { code: 'zh-traditional', name: '中文（繁体）' },
        { code: 'en', name: 'English' },
        { code: 'ja', name: '日本語' },
        { code: 'ko', name: '한국어' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'ru', name: 'Русский' },
        { code: 'pt', name: 'Português' },
        { code: 'it', name: 'Italiano' },
        { code: 'ar', name: 'العربية' },
        { code: 'th', name: 'ไทย' },
        { code: 'vi', name: 'Tiếng Việt' }
      ]
    }
  });
});

module.exports = router;
