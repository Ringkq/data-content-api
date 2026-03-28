const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * 简单的 HTTP 请求工具（使用 Node.js 内置模块）
 */
class HttpClient {
  static async get(urlString, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlString);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: options.timeout || 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...options.headers
        }
      };
      
      const req = protocol.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }
  
  static async post(urlString, body, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlString);
      const protocol = url.protocol === 'https:' ? https : http;
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        timeout: options.timeout || 60000,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...options.headers
        }
      };
      
      const req = protocol.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(bodyStr);
      req.end();
    });
  }
}

module.exports = HttpClient;
