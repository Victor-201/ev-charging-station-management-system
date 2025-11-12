import app from './app.js';
import env from './config/env.js';

const port = env.PORT || 8080;
app.listen(port, () => {
  console.log(`payment-service listening on port ${port}`);
});
