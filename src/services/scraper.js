const cheerio = require('cheerio');
const fetch = require('node-fetch');

/**
 * 网页抓取服务
 */
class ScraperService {
  constructor() {
    this.timeout = parseInt(process.env.PUPPETEER_TIMEOUT) || 30000;
  }
  
  /**
   * 抓取静态页面
   */
  async scrapeStatic(url, options = {}) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // 移除不需要的元素
      $('script, style, nav, footer, iframe, noscript').remove();
      
      // 提取基本信息
      const result = {
        url,
        title: this.extractTitle($),
        description: this.extractDescription($),
        content: this.extractContent($),
        images: this.extractImages($, url),
        links: this.extractLinks($, url),
        meta: {
          loadTime: (Date.now() - startTime) / 1000,
          wordCount: 0,
          statusCode: response.status
        }
      };
      
      // 计算字数
      result.meta.wordCount = result.content.replace(/\s+/g, '').length;
      
      // 如果指定了提取规则
      if (options.extract) {
        result.extracted = this.extractByRules($, options.extract, url);
      }
      
      return result;
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * 提取标题
   */
  extractTitle($) {
    return $('title').text().trim() ||
           $('h1').first().text().trim() ||
           $('meta[property="og:title"]').attr('content') || '';
  }
  
  /**
   * 提取描述
   */
  extractDescription($) {
    return $('meta[name="description"]').attr('content') ||
           $('meta[property="og:description"]').attr('content') ||
           $('p').first().text().trim().slice(0, 200) || '';
  }
  
  /**
   * 提取正文内容
   */
  extractContent($) {
    // 尝试找到主要内容区域
    const selectors = [
      'article',
      '[class*="content"]',
      '[class*="article"]',
      '[class*="post"]',
      '[class*="body"]',
      'main',
      '.main',
      '#content',
      '#main'
    ];
    
    for (const selector of selectors) {
      const content = $(selector).text().trim();
      if (content.length > 100) {
        return this.cleanText(content);
      }
    }
    
    // 如果找不到，返回 body 内容
    return this.cleanText($('body').text());
  }
  
  /**
   * 提取图片
   */
  extractImages($, baseUrl) {
    const images = [];
    $('img').each((i, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.startsWith('data:')) {
        // 转换为绝对 URL
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/')) {
          const urlObj = new URL(baseUrl);
          src = `${urlObj.origin}${src}`;
        } else if (!src.startsWith('http')) {
          const urlObj = new URL(baseUrl);
          src = `${urlObj.origin}/${src}`;
        }
        images.push({
          url: src,
          alt: $(el).attr('alt') || '',
          title: $(el).attr('title') || ''
        });
      }
    });
    return images.slice(0, 20); // 最多返回 20 张
  }
  
  /**
   * 提取链接
   */
  extractLinks($, baseUrl) {
    const links = [];
    const urlObj = new URL(baseUrl);
    
    $('a[href]').each((i, el) => {
      let href = $(el).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        // 转换为绝对 URL
        try {
          const fullUrl = new URL(href, baseUrl).href;
          links.push({
            url: fullUrl,
            text: $(el).text().trim(),
            isExternal: !fullUrl.includes(urlObj.hostname)
          });
        } catch (e) {
          // 忽略无效 URL
        }
      }
    });
    
    return links.slice(0, 50); // 最多返回 50 个
  }
  
  /**
   * 按规则提取数据
   */
  extractByRules($, rules, baseUrl) {
    const result = {};
    
    for (const [key, selector] of Object.entries(rules)) {
      if (typeof selector === 'string') {
        result[key] = $(selector).text().trim();
      } else if (typeof selector === 'object') {
        const { selector: sel, attr, multiple } = selector;
        
        if (multiple) {
          result[key] = [];
          $(sel).each((i, el) => {
            const value = attr ? $(el).attr(attr) : $(el).text().trim();
            if (value) result[key].push(value);
          });
        } else {
          const el = $(sel).first();
          result[key] = attr ? el.attr(attr) : el.text().trim();
        }
      }
    }
    
    return result;
  }
  
  /**
   * 清理文本
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }
  
  /**
   * 错误处理
   */
  handleError(error) {
    const err = new Error();
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      err.message = '无法访问目标网站';
      err.code = 'NETWORK_ERROR';
      err.status = 502;
    } else if (error.code === 'ETIMEDOUT') {
      err.message = '请求超时';
      err.code = 'TIMEOUT';
      err.status = 504;
    } else if (error.response) {
      err.message = `目标网站返回错误: ${error.response.status}`;
      err.code = 'UPSTREAM_ERROR';
      err.status = 502;
    } else {
      err.message = error.message || '抓取失败';
      err.code = 'SCRAPE_ERROR';
      err.status = 500;
    }
    
    return err;
  }
}

module.exports = new ScraperService();
