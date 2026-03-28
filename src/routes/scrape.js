const express = require('express');
const router = express.Router();
const scraper = require('../services/scraper');

/**
 * POST /api/v1/scrape
 * 网页抓取
 */
router.post('/scrape', async (req, res, next) => {
  try {
    const { url, extract, format = 'json' } = req.body;
    
    // 参数验证
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少 url 参数',
        code: 'MISSING_URL'
      });
    }
    
    // URL 格式验证
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'URL 格式无效',
        code: 'INVALID_URL'
      });
    }
    
    // 执行抓取
    const result = await scraper.scrapeStatic(url, { extract });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/scrape/batch
 * 批量网页抓取
 */
router.post('/scrape/batch', async (req, res, next) => {
  try {
    const { urls, extract } = req.body;
    
    // 参数验证
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少 urls 参数或格式无效',
        code: 'INVALID_URLS'
      });
    }
    
    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        error: '一次最多抓取 10 个页面',
        code: 'TOO_MANY_URLS'
      });
    }
    
    // 并发抓取
    const results = await Promise.allSettled(
      urls.map(url => scraper.scrapeStatic(url, { extract }))
    );
    
    const data = results.map((result, index) => ({
      url: urls[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
    
    res.json({
      success: true,
      data,
      summary: {
        total: urls.length,
        successful: data.filter(d => d.success).length,
        failed: data.filter(d => !d.success).length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/scrape/product
 * 电商产品抓取（针对 Amazon、淘宝、京东 等优化）
 */
router.post('/scrape/product', async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少 url 参数',
        code: 'MISSING_URL'
      });
    }
    
    // 根据网站选择提取规则
    const extractRules = {
      title: 'h1, [class*="title"], [class*="name"]',
      price: '[class*="price"], [class*="Price"]',
      description: '[class*="description"], [class*="detail"], [class*="content"]',
      images: {
        selector: 'img[class*="image"], img[class*="gallery"], img[src*="product"]',
        multiple: true,
        attr: 'src'
      }
    };
    
    const result = await scraper.scrapeStatic(url, { extract: extractRules });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
