const { v4: uuidv4 } = require('uuid');
const Waitlist = require('../models/Waitlist');
const { publish } = require('../../rabbit');

class WaitlistService {
  constructor(waitlistRepo) {
    this.repo = waitlistRepo;
  }

  async joinWaitlist(data) {
    const existing = await this.repo.findByUser(data.user_id);
    if (existing.length > 0) throw new Error('User already in waitlist');

    const position = data.position || 1;

    const waitlist = new Waitlist({
      waitlist_id: uuidv4(),
      user_id: data.user_id,
      station_id: data.station_id,
      connector_type: data.connector_type || 'Type2',
      position,
      estimated_wait_minutes: data.estimated_wait_minutes || 10,
      status: 'waiting'
    });

    await this.repo.create(waitlist);
    await publish('waitlist_events', { type: 'WAITLIST_JOINED', data: waitlist });

    return waitlist;
  }

  async removeWaitlist(waitlist_id) {
    await this.repo.remove(waitlist_id);
    await publish('waitlist_events', { type: 'WAITLIST_REMOVED', waitlist_id });
  }

  async getStationWaitlist(station_id) {
    return this.repo.getByStation(station_id);
  }
}

module.exports = WaitlistService;
