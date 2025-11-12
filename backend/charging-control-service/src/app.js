const express = require('express');
const bodyParser = require('body-parser');

const bookingRoutes = require('./routers/bookingRoutes');
const chargingRoutes = require('./routers/chargingRoutes');
const notificationRoutes = require('./routers/notificationRoutes');

const app = express();
app.use(bodyParser.json());

// --- Mount grouped routes ---
app.use('/api/v1/booking', bookingRoutes);
app.use('/api/v1/charging', chargingRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.get('/', (req, res) => res.send('🚗 EV Charging Service Running'));

module.exports = app;
