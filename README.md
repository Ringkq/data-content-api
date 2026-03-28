# DataContent API

> 一站式数据采集 + 内容处理 API  
> 面向跨境电商、内容创作者、研究人员

## 🚀 功能特性

| Endpoint | 功能 | 定价 |
|----------|------|------|
| `POST /api/v1/scrape` | 网页抓取与解析 | $0.002/次 |
| `POST /api/v1/scrape/batch` | 批量网页抓取 | $0.0015/次 |
| `POST /api/v1/summarize` | AI 智能摘要 | $0.003/次 |
| `POST /api/v1/generate` | AI 内容生成 | $0.005/次 |
| `POST /api/v1/translate` | 多语言翻译 | $0.002/次 |
| `POST /api/v1/ocr` | 图片文字识别 | $0.004/次 |
| `POST /api/v1/extract` | 智能数据提取 | $0.003/次 |

## 📦 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key
```

### 启动服务

```bash
npm start
# 开发模式
npm run dev
```

## 🔌 API 文档

### 1. 网页抓取

```bash
curl -X POST https://your-api.com/api/v1/scrape \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/product/123",
    "extract": ["title", "price", "description", "images"],
    "format": "json"
  }'
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "title": "产品标题",
    "price": "$99.99",
    "description": "产品描述...",
    "images": ["https://..."],
    "content": "页面正文内容..."
  },
  "meta": {
    "url": "https://example.com/product/123",
    "loadTime": 1.23,
    "wordCount": 456
  }
}
```

### 2. AI 摘要生成

```bash
curl -X POST https://your-api.com/api/v1/summarize \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "长文本内容...",
    "maxLength": 200,
    "language": "zh"
  }'
```

### 3. 内容生成

```bash
curl -X POST https://your-api.com/api/v1/generate \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "product-description",
    "keywords": ["无线耳机", "降噪", "长续航"],
    "tone": "professional",
    "language": "zh"
  }'
```

### 4. 翻译

```bash
curl -X POST https://your-api.com/api/v1/translate \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, World!",
    "source": "en",
    "target": "zh"
  }'
```

### 5. 图片 OCR

```bash
curl -X POST https://your-api.com/api/v1/ocr \
  -H "X-API-Key: your-api-key" \
  -F "image=@/path/to/image.png"
```

## 🛡️ 安全特性

- API Key 认证
- 速率限制（可配置）
- CORS 保护
- Helmet 安全头
- 输入验证

## 💰 定价方案

| 方案 | 月费 | 包含请求 | 超额费用 |
|------|------|---------|---------|
| Free | $0 | 100 次/月 | - |
| Starter | $9.99 | 5,000 次/月 | $0.002/次 |
| Pro | $49.99 | 50,000 次/月 | $0.001/次 |
| Enterprise | $199.99 | 500,000 次/月 | $0.0005/次 |

## 📊 目标客户

- **跨境电商**：抓取竞品数据、自动生成产品描述、多语言翻译
- **内容创作者**：素材收集、AI 内容生成、自动摘要
- **研究人员**：数据采集、文献摘要、信息提取

## 🔧 技术栈

- Node.js + Express
- Cheerio（HTML 解析）
- Puppeteer（动态页面渲染）
- Tesseract.js（OCR）
- Sharp（图片处理）
- OpenAI API（AI 功能）

## 📝 License

MIT
