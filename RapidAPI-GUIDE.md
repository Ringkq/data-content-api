# RapidAPI 上架指南

## 准备工作

### 1. 确保服务已部署并运行

服务需要有一个公网可访问的 URL，例如：
- `https://data-content-api.railway.app`
- `https://your-api.onrender.com`
- `https://api.yourdomain.com`

### 2. 准备 API 文档

确保所有 endpoint 都有清晰的文档说明。

---

## RapidAPI Provider 配置

### Step 1: 登录 RapidAPI Provider Dashboard

1. 访问 https://rapidapi.com/developer
2. 点击 "My APIs"
3. 点击 "Add New API"

### Step 2: 填写基本信息

| 字段 | 内容 |
|------|------|
| **API Name** | DataContent API |
| **Short Description** | 一站式数据采集与内容处理 API，支持网页抓取、AI摘要、内容生成、翻译、OCR等功能 |
| **Long Description** | 见下方 |
| **Category** | Data, Text, AI & ML |
| **Website** | 你的 GitHub 仓库或文档地址 |

**Long Description:**

```
DataContent API 是一款专为跨境电商、内容创作者和研究人员设计的一站式数据采集与内容处理 API。

核心功能：
✅ 网页抓取 - 轻松抓取任何网页内容，支持自定义提取规则
✅ AI 智能摘要 - 将长文本浓缩为简洁摘要
✅ 内容生成 - 自动生成产品描述、广告文案、社交媒体帖子
✅ 多语言翻译 - 支持 14+ 种语言的互译
✅ 图片 OCR - 从图片中提取文字
✅ 数据提取 - 智能提取结构化数据

适用场景：
• 跨境电商：抓取竞品数据、自动生成产品描述、多语言翻译
• 内容创作者：素材收集、AI 内容生成、自动摘要
• 研究人员：数据采集、文献摘要、信息提取

简单易用，只需一个 API Key 即可调用所有功能。
```

---

### Step 3: 配置 Endpoints

#### Endpoint 1: 网页抓取

| 字段 | 值 |
|------|-----|
| **Name** | Scrape Webpage |
| **Path** | /api/v1/scrape |
| **Method** | POST |
| **Description** | 抓取网页内容并提取关键信息 |

**Request Headers:**
```json
{
  "X-API-Key": "your-api-key",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "extract": {
    "title": "h1",
    "price": "[class*='price']"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "页面标题",
    "content": "页面内容...",
    "images": ["https://..."],
    "extracted": {
      "title": "提取的标题",
      "price": "$99.99"
    }
  }
}
```

---

#### Endpoint 2: AI 摘要

| 字段 | 值 |
|------|-----|
| **Name** | AI Summarize |
| **Path** | /api/v1/summarize |
| **Method** | POST |

**Request Body:**
```json
{
  "content": "长文本内容...",
  "maxLength": 200,
  "language": "zh"
}
```

---

#### Endpoint 3: 内容生成

| 字段 | 值 |
|------|-----|
| **Name** | AI Generate Content |
| **Path** | /api/v1/generate |
| **Method** | POST |

**Request Body:**
```json
{
  "type": "product-description",
  "keywords": ["无线耳机", "降噪", "长续航"],
  "tone": "professional",
  "language": "zh"
}
```

**Supported Types:**
- `product-description` - 产品描述
- `ad-copy` - 广告文案
- `social-post` - 社交媒体帖子
- `blog-outline` - 博客大纲
- `email` - 邮件

---

#### Endpoint 4: 翻译

| 字段 | 值 |
|------|-----|
| **Name** | Translate Text |
| **Path** | /api/v1/translate |
| **Method** | POST |

**Request Body:**
```json
{
  "text": "Hello, World!",
  "source": "en",
  "target": "zh"
}
```

---

#### Endpoint 5: OCR

| 字段 | 值 |
|------|-----|
| **Name** | Image OCR |
| **Path** | /api/v1/ocr |
| **Method** | POST |

**Request Body (form-data):**
```
image: [图片文件]
language: zh+en
```

---

#### Endpoint 6: 数据提取

| 字段 | 值 |
|------|-----|
| **Name** | Extract Data |
| **Path** | /api/v1/extract |
| **Method** | POST |

**Request Body:**
```json
{
  "content": "文本内容...",
  "schema": {
    "name": "string",
    "price": "number",
    "features": "string[]"
  }
}
```

---

### Step 4: 设置定价

推荐定价方案：

| Plan | Monthly Price | Requests Included | Overage |
|------|--------------|------------------|---------|
| **Free** | $0 | 100 | - |
| **Basic** | $9.99 | 5,000 | $0.002/req |
| **Pro** | $49.99 | 50,000 | $0.001/req |
| **Ultra** | $199.99 | 500,000 | $0.0005/req |

**RapidAPI 会自动处理：**
- 用户订阅
- 计费
- 付款
- API Key 管理

---

### Step 5: 配置 Backend URL

在 "Backend Configuration" 中设置：

```
Backend URL: https://your-deployed-api.com
```

RapidAPI 会自动：
- 将请求转发到你的服务
- 添加 `X-RapidAPI-Key` header
- 处理速率限制

**注意：** 你需要修改认证中间件，同时支持：
- `X-API-Key`（直接调用）
- `X-RapidAPI-Key`（RapidAPI 调用）

```javascript
// src/middleware/auth.js
function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['x-rapidapi-key'] ||
                 req.query.apiKey;
  
  // 验证 API Key
  const validKeys = (process.env.API_KEYS || '').split(',').map(k => k.trim());
  const rapidApiKeys = (process.env.RAPIDAPI_KEYS || '').split(',').map(k => k.trim());
  
  if (!validKeys.includes(apiKey) && !rapidApiKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'API Key 无效',
      code: 'INVALID_API_KEY'
    });
  }
  
  next();
}
```

---

### Step 6: 测试并发布

1. 使用 RapidAPI 的测试工具测试每个 endpoint
2. 检查响应格式和错误处理
3. 点击 "Submit for Review"
4. 等待 RapidAPI 团队审核（通常 1-3 天）

---

## 上架后

### 1. 优化 API 列表页

- 添加清晰的 Logo 和 Banner
- 完善文档和示例
- 添加 FAQ

### 2. 营销推广

- 在 Product Hunt 发布
- 在相关社区分享（Reddit、Hacker News）
- 写博客文章介绍使用场景
- 制作视频教程

### 3. 收集反馈

- 关注用户评价
- 根据反馈改进功能
- 持续优化性能

---

## 常见问题

**Q: 如何处理 RapidAPI 的费用？**
A: RapidAPI 会从订阅费用中扣除平台费（约 20%），剩余部分按月支付给你。

**Q: 如何防止滥用？**
A: 设置合理的速率限制，监控异常请求模式。

**Q: 如何提供技术支持？**
A: 可以通过邮件、Discord 或 RapidAPI 的消息系统提供支持。

---

## 下一步

1. 🚀 部署服务到 Railway/Render
2. 📝 在 RapidAPI 创建 API
3. ✅ 配置所有 endpoints
4. 💰 设置定价方案
5. 🧪 测试并发布
6. 📢 推广营销

祝你的 API 大卖！💰
