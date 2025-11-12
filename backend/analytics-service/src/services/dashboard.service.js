import { query } from '../config/database.js';

export const listDashboards = async () => {
  const dashboards = await query(
    `SELECT dashboard_id AS id, name, description
     FROM dashboards
     ORDER BY created_at DESC`
  );
  const formatted = dashboards.map((item) => ({
    id: `D${String(item.id).padStart(3, '0')}`,
    name: item.name
  }));
  return { dashboards: formatted };
};

export const createDashboard = async ({ name, widgets }) => {
  const payload = JSON.stringify(widgets ?? []);
  const result = await query(
    `INSERT INTO dashboards (name, widgets)
     VALUES (?, ?)`,
    [name, payload]
  );

  return {
    id: `D${String(result.insertId).padStart(3, '0')}`,
    status: 'created'
  };
};
