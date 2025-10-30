import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import monitoringRoutes from './routes/monitoring.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import telemetryRoutes from './routes/telemetry.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import analyticsAIRoutes from "./routes/analyticsAI.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/api/v1/dashboards', dashboardRoutes);
app.use("/api/v1/analytics/ai", analyticsAIRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((error, _req, res, _next) => {
  // log stack trace to stdout for now
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
