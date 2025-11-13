export default class EventOutbox {
  constructor({
    id,
    aggregate_type,
    aggregate_id,
    type,
    payload,
    status = 'pending',
    created_at,
    updated_at,
  }) {
    if (!aggregate_type) throw new Error('aggregate_type is required');
    if (!aggregate_id) throw new Error('aggregate_id is required');
    if (!type) throw new Error('type is required');
    if (!payload) throw new Error('payload is required');

    const validStatuses = ['pending', 'published', 'failed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid outbox status: ${status}`);
    }

    this.id = id;
    this.aggregate_type = aggregate_type;
    this.aggregate_id = aggregate_id;
    this.type = type;
    this.payload = typeof payload === 'object' ? payload : JSON.parse(payload);
    this.status = status;
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
  }

  /** === Đánh dấu event đã được publish thành công === */
  markAsPublished() {
    this.status = 'published';
    this.updated_at = new Date();
  }

  /** === Đánh dấu event bị lỗi khi publish === */
  markAsFailed() {
    this.status = 'failed';
    this.updated_at = new Date();
  }

  /** === Chuyển model sang JSON để lưu xuống DB hoặc gửi MQ === */
  toJSON() {
    return {
      id: this.id,
      aggregate_type: this.aggregate_type,
      aggregate_id: this.aggregate_id,
      type: this.type,
      payload: this.payload,
      status: this.status,
      created_at: this.created_at ? this.created_at.toISOString() : null,
      updated_at: this.updated_at ? this.updated_at.toISOString() : null,
    };
  }

  /** === Tạo instance từ 1 row trong DB === */
  static fromRow(row) {
    if (!row) return null;
    return new EventOutbox({
      id: row.id,
      aggregate_type: row.aggregate_type,
      aggregate_id: row.aggregate_id,
      type: row.type,
      payload: row.payload,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
}
