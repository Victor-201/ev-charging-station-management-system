import * as jwt from 'jsonwebtoken';

const JWT_SECRET = '03bc23c433edb2a7e14229bad9821d2e6a8ca80d92d508a01e541c3fa4ed310508ca9a8dfd4a7addc92cea74eee18a78f6de4f8436850418c6fc42be57cwl7t3';

const payload = {
  sub: 'admin-id-001',
  id: 'vc0ec766-3b06-40a9-8b69-9d56c61fd56f',
  email: 'admin@example.com',
  role: 'admin',
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

console.log('Access Token:', token);
