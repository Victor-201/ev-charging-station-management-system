class EventOutbox {
  constructor(data = {}) {
    this.id = data.id || require('uuid').v4();
    this.aggregate_type = data.aggregate_type;
    this.aggregate_id = data.aggregate_id;
    this.type = data.type;
    this.payload = data.payload || {};
    this.status = data.status || 'pending'; // pending | processed | failed
    this.created_at = data.created_at ? new Date(data.created_at) : new Date();
    this.updated_at = data.updated_at ? new Date(data.updated_at) : new Date();
  }

  toJSON() {
    return {
      id: this.id,
      aggregate_type: this.aggregate_type,
      aggregate_id: this.aggregate_id,
      type: this.type,
      payload: this.payload,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = EventOutbox;
