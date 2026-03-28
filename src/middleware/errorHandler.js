/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // 默认错误信息
  let status = err.status || 500;
  let message = err.message || '服务器内部错误';
  let code = err.code || 'INTERNAL_ERROR';
  
  // 特定错误处理
  if (err.name === 'ValidationError') {
    status = 400;
    message = '请求参数验证失败';
    code = 'VALIDATION_ERROR';
  }
  
  if (err.name === 'UnauthorizedError') {
    status = 401;
    message = '未授权访问';
    code = 'UNAUTHORIZED';
  }
  
  // 超时错误
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    status = 504;
    message = '请求超时';
    code = 'TIMEOUT';
  }
  
  // 网络错误
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    status = 502;
    message = '无法访问目标网站';
    code = 'NETWORK_ERROR';
  }
  
  res.status(status).json({
    success: false,
    error: message,
    code: code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
