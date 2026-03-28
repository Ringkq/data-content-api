const express = require('express');
const router = express.Router();
const ai = require('../services/ai');

/**
 * POST /api/v1/summarize
 * AI 摘要生成
 */
router.post('/summarize', async (req, res, next) => {
  try {
    const { content, maxLength = 200, language = 'zh' } = req.body;
    
    // 参数验证
    if (!content) {
      return res.status(400).json({
        success: false,
        error: '缺少 content 参数',
        code: 'MISSING_CONTENT'
      });
    }
    
    if (content.length < 50) {
      return res.status(400).json({
        success: false,
        error: '内容太短，无需生成摘要',
        code: 'CONTENT_TOO_SHORT'
      });
    }
    
    // 生成摘要
    const summary = await ai.summarize(content, { maxLength, language });
    
    res.json({
      success: true,
      data: {
        summary,
        originalLength: content.length,
        summaryLength: summary.length,
        compressionRatio: (1 - summary.length / content.length).toFixed(2)
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/summarize/url
 * 从 URL 抓取内容并生成摘要
 */
router.post('/summarize/url', async (req, res, next) => {
  try {
    const { url, maxLength = 200, language = 'zh' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少 url 参数',
        code: 'MISSING_URL'
      });
    }
    
    // 抓取内容
    const scraper = require('../services/scraper');
    const scraped = await scraper.scrapeStatic(url);
    
    if (!scraped.content || scraped.content.length < 50) {
      return res.status(400).json({
        success: false,
        error: '页面内容太短或无法提取',
        code: 'INSUFFICIENT_CONTENT'
      });
    }
    
    // 生成摘要
    const summary = await ai.summarize(scraped.content, { maxLength, language });
    
    res.json({
      success: true,
      data: {
        url,
        title: scraped.title,
        summary,
        originalLength: scraped.content.length,
        summaryLength: summary.length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
