const request = require('supertest');
const app = require('../src/index');

describe('DataContent API', () => {
  
  describe('Health Check', () => {
    it('should return ok status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
  
  describe('API Info', () => {
    it('should return API information', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('DataContent API');
    });
  });
  
  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const res = await request(app)
        .post('/api/v1/scrape')
        .send({ url: 'https://example.com' });
      expect(res.status).toBe(401);
    });
    
    it('should reject invalid API key', async () => {
      const res = await request(app)
        .post('/api/v1/scrape')
        .set('X-API-Key', 'invalid-key')
        .send({ url: 'https://example.com' });
      expect(res.status).toBe(403);
    });
  });
  
  describe('Scrape API', () => {
    it('should require URL parameter', async () => {
      const res = await request(app)
        .post('/api/v1/scrape')
        .set('X-API-Key', 'test-api-key-12345')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_URL');
    });
    
    it('should reject invalid URL', async () => {
      const res = await request(app)
        .post('/api/v1/scrape')
        .set('X-API-Key', 'test-api-key-12345')
        .send({ url: 'not-a-valid-url' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_URL');
    });
  });
  
  describe('Summarize API', () => {
    it('should require content parameter', async () => {
      const res = await request(app)
        .post('/api/v1/summarize')
        .set('X-API-Key', 'test-api-key-12345')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_CONTENT');
    });
    
    it('should reject short content', async () => {
      const res = await request(app)
        .post('/api/v1/summarize')
        .set('X-API-Key', 'test-api-key-12345')
        .send({ content: 'short text' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CONTENT_TOO_SHORT');
    });
  });
  
  describe('Generate API', () => {
    it('should require type parameter', async () => {
      const res = await request(app)
        .post('/api/v1/generate')
        .set('X-API-Key', 'test-api-key-12345')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_TYPE');
    });
    
    it('should reject unsupported type', async () => {
      const res = await request(app)
        .post('/api/v1/generate')
        .set('X-API-Key', 'test-api-key-12345')
        .send({ type: 'unsupported-type' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('UNSUPPORTED_TYPE');
    });
  });
  
  describe('Translate API', () => {
    it('should require text parameter', async () => {
      const res = await request(app)
        .post('/api/v1/translate')
        .set('X-API-Key', 'test-api-key-12345')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_TEXT');
    });
  });
});
