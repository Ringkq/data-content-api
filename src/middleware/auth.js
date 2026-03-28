/**
 * API Key 认证中间件
 */
function authMiddleware(req, res, next) {
  // 从 header 或 query 获取 API Key
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: '缺少 API Key，请在 header 中添加 X-API-Key',
      code: 'MISSING_API_KEY'
    });
  }
  
  // 验证 API Key
  const validKeys = (process.env.API_KEYS || '').split(',').map(k => k.trim());
  
  if (!validKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'API Key 无效',
      code: 'INVALID_API_KEY'
    });
  }
  
  // 记录使用情况（后续可接入数据库）
  req.apiKey = apiKey;
  next();
}

module.exports = authMiddleware;
