const HttpClient = require('../utils/http');

/**
 * AI 服务 - 调用大模型 API
 */
class AIService {
  constructor() {
    // 优先级：本地 Ollama > DeepSeek > OpenAI
    this.useLocal = process.env.USE_LOCAL_MODEL === 'true';
    
    if (this.useLocal) {
      this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api/chat';
      this.model = process.env.OLLAMA_MODEL || 'mistral';
    } else {
      this.apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
      this.baseUrl = process.env.AI_API_BASE || 'https://api.deepseek.com/chat/completions';
      this.model = process.env.AI_MODEL || 'deepseek-chat';
    }
  }
  
  /**
   * 调用 AI API
   */
  async chat(messages, options = {}) {
    if (!this.useLocal && !this.apiKey) {
      throw new Error('AI API Key 未配置');
    }
    
    try {
      const body = this.useLocal 
        ? this.buildOllamaRequest(messages, options)
        : this.buildDeepSeekRequest(messages, options);
      
      const headers = this.useLocal 
        ? {}
        : { 'Authorization': `Bearer ${this.apiKey}` };
      
      const response = await HttpClient.post(
        this.baseUrl,
        body,
        {
          timeout: 120000,
          headers
        }
      );
      
      if (response.status !== 200) {
        const error = JSON.parse(response.data);
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }
      
      const data = JSON.parse(response.data);
      
      if (this.useLocal) {
        return data.message.content;
      } else {
        return data.choices[0].message.content;
      }
      
    } catch (error) {
      console.error('AI API Error:', error.message);
      throw new Error('AI 服务调用失败: ' + error.message);
    }
  }
  
  /**
   * 构建 Ollama 请求
   */
  buildOllamaRequest(messages, options) {
    return {
      model: options.model || this.model,
      messages,
      stream: false,
      ...options
    };
  }
  
  /**
   * 构建 DeepSeek 请求
   */
  buildDeepSeekRequest(messages, options) {
    return {
      model: options.model || this.model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      ...options
    };
  }
  
  /**
   * 生成摘要
   */
  async summarize(content, options = {}) {
    const maxLength = options.maxLength || 200;
    const language = options.language || 'zh';
    
    const prompt = language === 'zh' 
      ? `请将以下内容总结为${maxLength}字以内的摘要，保留关键信息：\n\n${content}`
      : `Summarize the following content in ${maxLength} words or less, keeping key information:\n\n${content}`;
    
    return this.chat([
      { role: 'system', content: 'You are a professional summarizer. Provide concise and accurate summaries.' },
      { role: 'user', content: prompt }
    ], { maxTokens: Math.floor(maxLength * 1.5) });
  }
  
  /**
   * 生成内容
   */
  async generate(type, params) {
    const prompts = {
      'product-description': () => {
        const { keywords, tone = 'professional', language = 'zh' } = params;
        return language === 'zh'
          ? `请根据以下关键词生成一段吸引人的产品描述（语气：${tone}）：\n关键词：${keywords.join('、')}\n\n要求：突出产品特点，吸引潜在买家，200字以内。`
          : `Generate an attractive product description based on these keywords (tone: ${tone}):\nKeywords: ${keywords.join(', ')}\n\nRequirements: Highlight product features, attract potential buyers, within 200 words.`;
      },
      
      'ad-copy': () => {
        const { product, target, platform = 'general', language = 'zh' } = params;
        return language === 'zh'
          ? `请为以下产品撰写${platform === 'general' ? '' : platform + '平台'}的广告文案：\n产品：${product}\n目标受众：${target}\n\n要求：简洁有力，突出卖点，吸引点击。`
          : `Write ad copy for the following product${platform === 'general' ? '' : ' for ' + platform}:\nProduct: ${product}\nTarget Audience: ${target}\n\nRequirements: Concise, compelling, highlight USP, drive clicks.`;
      },
      
      'social-post': () => {
        const { topic, platform = 'twitter', tone = 'casual', language = 'zh' } = params;
        return language === 'zh'
          ? `请为${platform}平台创作一条关于"${topic}"的帖子（语气：${tone}）：\n\n要求：吸引互动，适合平台风格。`
          : `Create a ${platform} post about "${topic}" (tone: ${tone}):\n\nRequirements: Engaging, platform-appropriate.`;
      },
      
      'blog-outline': () => {
        const { topic, sections = 5, language = 'zh' } = params;
        return language === 'zh'
          ? `请为"${topic}"生成一篇博客文章大纲，包含${sections}个主要章节：\n\n要求：结构清晰，每节简述要点。`
          : `Generate a blog post outline for "${topic}" with ${sections} main sections:\n\nRequirements: Clear structure, brief points for each section.`;
      },
      
      'email': () => {
        const { subject, recipient, purpose, tone = 'professional', language = 'zh' } = params;
        return language === 'zh'
          ? `请撰写一封邮件：\n主题：${subject}\n收件人：${recipient}\n目的：${purpose}\n语气：${tone}\n\n要求：专业得体，表达清晰。`
          : `Write an email:\nSubject: ${subject}\nRecipient: ${recipient}\nPurpose: ${purpose}\nTone: ${tone}\n\nRequirements: Professional, clear expression.`;
      }
    };
    
    const promptGenerator = prompts[type];
    if (!promptGenerator) {
      throw new Error(`不支持的生成类型: ${type}`);
    }
    
    return this.chat([
      { role: 'system', content: 'You are a professional content creator. Generate high-quality, engaging content.' },
      { role: 'user', content: promptGenerator() }
    ]);
  }
  
  /**
   * 翻译
   */
  async translate(text, source, target) {
    const sourceLang = this.getLanguageName(source);
    const targetLang = this.getLanguageName(target);
    
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only output the translation, no explanations:\n\n${text}`;
    
    return this.chat([
      { role: 'system', content: 'You are a professional translator. Provide accurate and natural translations.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });
  }
  
  /**
   * 提取数据
   */
  async extract(content, schema) {
    const schemaStr = JSON.stringify(schema, null, 2);
    
    const prompt = `Extract structured data from the following content according to this schema. Return as JSON only:\n\nSchema:\n${schemaStr}\n\nContent:\n${content}`;
    
    const result = await this.chat([
      { role: 'system', content: 'You are a data extraction expert. Extract structured data accurately. Return valid JSON only, no markdown formatting.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.1 });
    
    try {
      // 尝试解析 JSON
      return JSON.parse(result);
    } catch (e) {
      // 如果解析失败，尝试提取 JSON 块
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('AI 返回的数据格式无效');
    }
  }
  
  /**
   * 获取语言名称
   */
  getLanguageName(code) {
    const languages = {
      'zh': 'Chinese',
      'en': 'English',
      'ja': 'Japanese',
      'ko': 'Korean',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'it': 'Italian',
      'ar': 'Arabic',
      'th': 'Thai',
      'vi': 'Vietnamese'
    };
    return languages[code] || code;
  }
}

module.exports = new AIService();
