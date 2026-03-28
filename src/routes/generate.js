const express = require('express');
const router = express.Router();
const ai = require('../services/ai');

/**
 * POST /api/v1/generate
 * AI 内容生成
 * 
 * 支持类型：
 * - product-description: 产品描述
 * - ad-copy: 广告文案
 * - social-post: 社交媒体帖子
 * - blog-outline: 博客大纲
 * - email: 邮件
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { type, ...params } = req.body;
    
    // 参数验证
    if (!type) {
      return res.status(400).json({
        success: false,
        error: '缺少 type 参数',
        code: 'MISSING_TYPE',
        supportedTypes: ['product-description', 'ad-copy', 'social-post', 'blog-outline', 'email']
      });
    }
    
    const supportedTypes = ['product-description', 'ad-copy', 'social-post', 'blog-outline', 'email'];
    if (!supportedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `不支持的生成类型: ${type}`,
        code: 'UNSUPPORTED_TYPE',
        supportedTypes
      });
    }
    
    // 生成内容
    const content = await ai.generate(type, params);
    
    res.json({
      success: true,
      data: {
        type,
        content,
        params: {
          ...params,
          // 隐藏敏感信息
          ...(params.keywords && { keywords: params.keywords })
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/generate/batch
 * 批量内容生成
 */
router.post('/generate/batch', async (req, res, next) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少 items 参数或格式无效',
        code: 'INVALID_ITEMS'
      });
    }
    
    if (items.length > 5) {
      return res.status(400).json({
        success: false,
        error: '一次最多生成 5 条内容',
        code: 'TOO_MANY_ITEMS'
      });
    }
    
    // 并发生成
    const results = await Promise.allSettled(
      items.map(item => ai.generate(item.type, item))
    );
    
    const data = results.map((result, index) => ({
      index,
      type: items[index].type,
      success: result.status === 'fulfilled',
      content: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
    
    res.json({
      success: true,
      data,
      summary: {
        total: items.length,
        successful: data.filter(d => d.success).length,
        failed: data.filter(d => !d.success).length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
