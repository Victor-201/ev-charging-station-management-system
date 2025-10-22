import app from './app.js';
import env from './config/env.js';

const port = env.PORT || 3000;
app.listen(port, () => {
  console.log(`payment-service listening on port ${port}`);
});
