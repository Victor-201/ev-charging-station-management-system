const IoTManager = require('./IoTManager');
const { io } = require('../app');
const chargingService = require('../services/ChargingService'); 

const manager = new IoTManager(io, chargingService);

module.exports = manager;
