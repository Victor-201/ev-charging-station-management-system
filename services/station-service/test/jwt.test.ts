import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret_key';

const payload = {
  sub: 'admin-id-001',
  id: 'vc0ec766-3b06-40a9-8b69-9d56c61fd56f',
  email: 'admin@example.com',
  role: 'admin',
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

console.log('Access Token:', token);
