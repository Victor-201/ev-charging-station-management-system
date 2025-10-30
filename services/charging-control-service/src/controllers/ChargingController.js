const ChargingService = require('../services/ChargingService');

exports.initiateSession = async (req, res) => {
  try {
    const result = await ChargingService.initiateSession(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.startSession = async (req, res) => {
  const result = await ChargingService.startSession(req.body.session_id);
  res.json(result);
};

exports.pushMeterReading = async (req, res) => {
  const data = await ChargingService.pushMeterReading(req.body);
  res.json(data);
};

exports.getTelemetry = async (req, res) => {
  const data = await ChargingService.getTelemetry(req.params.session_id);
  res.json(data);
};

exports.pauseSession = async (req, res) => {
  const data = await ChargingService.pauseSession(req.params.session_id);
  res.json(data);
};

exports.resumeSession = async (req, res) => {
  const data = await ChargingService.resumeSession(req.params.session_id);
  res.json(data);
};

exports.stopSession = async (req, res) => {
  const data = await ChargingService.stopSession(req.params.session_id);
  res.json(data);
};

exports.getSession = async (req, res) => {
  const data = await ChargingService.getSession(req.params.session_id);
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
};

exports.getEvents = async (req, res) => {
  res.json({ events: [] });
};
