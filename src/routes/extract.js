const express = require('express');
const router = express.Router();
const ai = require('../services/ai');
const scraper = require('../services/scraper');

/**
 * POST /api/v1/extract
 * 智能数据提取
 */
router.post('/extract', async (req, res, next) => {
  try {
    const { content, schema } = req.body;
    
    // 参数验证
    if (!content) {
      return res.status(400).json({
        success: false,
        error: '缺少 content 参数',
        code: 'MISSING_CONTENT'
      });
    }
    
    if (!schema) {
      return res.status(400).json({
        success: false,
        error: '缺少 schema 参数',
        code: 'MISSING_SCHEMA',
        example: {
          schema: {
            name: 'string',
            price: 'number',
            description: 'string',
            features: 'string[]'
          }
        }
      });
    }
    
    // 执行提取
    const extracted = await ai.extract(content, schema);
    
    res.json({
      success: true,
      data: extracted
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/extract/url
 * 从 URL 提取结构化数据
 */
router.post('/extract/url', async (req, res, next) => {
  try {
    const { url, schema } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少 url 参数',
        code: 'MISSING_URL'
      });
    }
    
    if (!schema) {
      return res.status(400).json({
        success: false,
        error: '缺少 schema 参数',
        code: 'MISSING_SCHEMA'
      });
    }
    
    // 抓取内容
    const scraped = await scraper.scrapeStatic(url);
    
    if (!scraped.content || scraped.content.length < 50) {
      return res.status(400).json({
        success: false,
        error: '页面内容太短或无法提取',
        code: 'INSUFFICIENT_CONTENT'
      });
    }
    
    // 提取结构化数据
    const extracted = await ai.extract(
      `标题: ${scraped.title}\n\n内容: ${scraped.content}`,
      schema
    );
    
    res.json({
      success: true,
      data: {
        url,
        title: scraped.title,
        extracted
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/extract/products
 * 从电商页面提取产品信息
 */
router.post('/extract/products', async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少 url 参数',
        code: 'MISSING_URL'
      });
    }
    
    // 产品信息 schema
    const schema = {
      products: [
        {
          name: 'string',
          price: 'string',
          originalPrice: 'string (optional)',
          discount: 'string (optional)',
          rating: 'string (optional)',
          reviews: 'number (optional)',
          image: 'string (optional)',
          url: 'string (optional)'
        }
      ],
      totalProducts: 'number (optional)',
      category: 'string (optional)'
    };
    
    // 抓取并提取
    const scraped = await scraper.scrapeStatic(url);
    const extracted = await ai.extract(
      `标题: ${scraped.title}\n\n内容: ${scraped.content}\n\n图片: ${scraped.images.map(i => i.url).join(', ')}`,
      schema
    );
    
    res.json({
      success: true,
      data: {
        url,
        ...extracted
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/extract/contacts
 * 从页面提取联系信息
 */
router.post('/extract/contacts', async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少 url 参数',
        code: 'MISSING_URL'
      });
    }
    
    // 联系信息 schema
    const schema = {
      company: 'string',
      emails: 'string[]',
      phones: 'string[]',
      addresses: 'string[]',
      socialMedia: {
        facebook: 'string (optional)',
        twitter: 'string (optional)',
        linkedin: 'string (optional)',
        instagram: 'string (optional)',
        wechat: 'string (optional)'
      }
    };
    
    // 抓取并提取
    const scraped = await scraper.scrapeStatic(url);
    const extracted = await ai.extract(scraped.content, schema);
    
    res.json({
      success: true,
      data: {
        url,
        ...extracted
      }
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
