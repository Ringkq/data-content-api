# 部署指南

## 方案一：Railway（推荐）

Railway 提供免费额度，适合起步。

### 步骤

1. **注册 Railway**
   - 访问 https://railway.app
   - 使用 GitHub 账号登录

2. **创建新项目**
   ```bash
   # 安装 Railway CLI
   npm i -g @railway/cli
   
   # 登录
   railway login
   
   # 初始化项目
   railway init
   ```

3. **配置环境变量**
   ```bash
   railway variables set API_KEYS=your-production-api-key
   railway variables set OPENAI_API_KEY=sk-your-key
   railway variables set OPENAI_MODEL=gpt-4o-mini
   ```

4. **部署**
   ```bash
   railway up
   ```

5. **获取域名**
   - Railway 会自动分配一个域名
   - 也可以绑定自定义域名

---

## 方案二：Render

Render 也提供免费层，且无需信用卡。

### 步骤

1. **创建账户**
   - 访问 https://render.com
   - 连接 GitHub 仓库

2. **创建 Web Service**
   - 选择仓库
   - 设置：
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Environment: Node

3. **添加环境变量**
   - 在 Dashboard 中添加所有 `.env` 中的变量

4. **部署**
   - 自动部署，每次 push 都会重新部署

---

## 方案三：Vercel Serverless

适合轻量级 API。

### 步骤

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **创建 vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/index.js"
       }
     ]
   }
   ```

3. **部署**
   ```bash
   vercel
   ```

---

## 方案四：自建服务器（VPS）

适合需要完全控制和高性能的场景。

### 推荐 VPS

- **国内**：阿里云、腾讯云、华为云
- **国外**：DigitalOcean、Vultr、Linode

### 部署步骤

1. **购买 VPS**
   - 最低配置：1核 1GB 内存
   - 推荐系统：Ubuntu 22.04

2. **安装 Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **安装 PM2**
   ```bash
   sudo npm install -g pm2
   ```

4. **部署代码**
   ```bash
   git clone your-repo
   cd data-content-api
   npm install
   npm run build  # 如果需要
   ```

5. **配置 PM2**
   ```bash
   pm2 start src/index.js --name data-content-api
   pm2 save
   pm2 startup
   ```

6. **配置 Nginx 反向代理**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **配置 SSL（Let's Encrypt）**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

## 上架 RapidAPI

### 步骤

1. **登录 RapidAPI**
   - 访问 https://rapidapi.com
   - 进入 Provider Dashboard

2. **添加新 API**
   - 点击 "Add New API"
   - 填写基本信息：
     - Name: DataContent API
     - Description: 一站式数据采集与内容处理 API
     - Category: Data, Text, AI

3. **配置 Endpoints**
   - 添加所有接口
   - 设置请求/响应格式

4. **设置定价**
   ```
   Free: $0 (100 requests/month)
   Basic: $9.99 (5,000 requests/month)
   Pro: $49.99 (50,000 requests/month)
   Ultra: $199.99 (500,000 requests/month)
   ```

5. **测试并发布**
   - 使用 RapidAPI 的测试工具测试
   - 提交审核

---

## 监控与日志

### 推荐工具

- **Sentry**：错误监控
- **LogDNA / Papertrail**：日志管理
- **UptimeRobot**：可用性监控

### 配置示例

```javascript
// src/index.js 添加
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 成本估算

| 平台 | 免费额度 | 超额费用 | 适合场景 |
|------|---------|---------|---------|
| Railway | $5/月 | 按量付费 | 起步、测试 |
| Render | 750小时/月 | 按量付费 | 小规模生产 |
| Vercel | 100GB带宽 | 按量付费 | Serverless |
| VPS | 固定费用 | - | 高性能、完全控制 |
