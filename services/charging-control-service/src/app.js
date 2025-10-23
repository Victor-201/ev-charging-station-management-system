const express = require('express');
const bodyParser = require('body-parser');

const reservationRoutes = require('./routers/reservations');
const notificationRoutes = require('./routers/notifications');
const qrRoutes = require('./routers/qr');
const sessionRoutes = require('./routers/sessions');

const app = express();
app.use(bodyParser.json());

app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/qr', qrRoutes);
app.use('/api/v1/sessions', sessionRoutes);

app.get('/', (req, res) => res.send('EV Reservation Service Running 🚗'));

module.exports = app;
