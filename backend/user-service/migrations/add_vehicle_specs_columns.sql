-- Add columns for vehicle specifications from API
ALTER TABLE vehicles ADD COLUMN usable_battery_capacity VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN charge_port VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN max_charge_power VARCHAR(50);

