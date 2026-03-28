const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 加载环境变量
try {
  require('dotenv').config();
} catch (e) {
  // dotenv 可选
}

// 路由
const scrapeRoutes = require('./routes/scrape');
const summarizeRoutes = require('./routes/summarize');
const generateRoutes = require('./routes/generate');
const translateRoutes = require('./routes/translate');
const extractRoutes = require('./routes/extract');

// 中间件
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors());

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查（无需认证）
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 信息（无需认证）
app.get('/', (req, res) => {
  res.json({
    name: 'DataContent API',
    version: '1.0.0',
    description: '一站式数据采集 + 内容处理 API',
    endpoints: {
      scrape: 'POST /api/v1/scrape - 网页抓取',
      scrapeBatch: 'POST /api/v1/scrape/batch - 批量抓取',
      summarize: 'POST /api/v1/summarize - AI 摘要',
      generate: 'POST /api/v1/generate - 内容生成',
      translate: 'POST /api/v1/translate - 翻译',
      extract: 'POST /api/v1/extract - 数据提取'
    },
    docs: 'https://github.com/Ringkq/data-content-api'
  });
});

// API 路由（需要认证）
app.use('/api/v1', authMiddleware);
app.use('/api/v1', scrapeRoutes);
app.use('/api/v1', summarizeRoutes);
app.use('/api/v1', generateRoutes);
app.use('/api/v1', translateRoutes);
app.use('/api/v1', extractRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    code: 'NOT_FOUND'
  });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 DataContent API 运行在 http://localhost:${PORT}`);
  console.log(`📖 API 文档: http://localhost:${PORT}`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;
