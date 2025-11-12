import * as analyticsAIService from "../services/analyticsAI.service.js";

export async function getSystemStats(req, res) {
  try {
    const stats = await analyticsAIService.getSystemStats();
    res.json({ status: "ok", data: stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

export async function analyzeUserBehavior(req, res) {
  try {
    const result = await analyticsAIService.analyzeUserBehavior();
    res.json({ status: "ok", data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

export async function forecastStationDemand(req, res) {
  try {
    const { station_id: stationId } = req.params;
    const days = Number(req.query.days ?? 7);

    if (!stationId) {
      res.status(400).json({ status: "error", message: "station_id is required" });
      return;
    }

    const forecast = await analyticsAIService.forecastStationDemand({ stationId, days });
    res.json({ status: "ok", station_id: stationId, forecast });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
}
