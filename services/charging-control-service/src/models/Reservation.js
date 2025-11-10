class Reservation {
  constructor(data = {}) {
    this.reservation_id = data.reservation_id;
    this.user_id = data.user_id;
    this.station_id = data.station_id;
    this.point_id = data.point_id;

    this.connector_type = data.connector_type || 'Type2';

    // Convert date fields safely
    this.start_time = data.start_time ? new Date(data.start_time) : null;
    this.end_time = data.end_time ? new Date(data.end_time) : null;
    this.expires_at = data.expires_at ? new Date(data.expires_at) : null;

    this.created_at = data.created_at ? new Date(data.created_at) : new Date();
    this.updated_at = data.updated_at ? new Date(data.updated_at) : new Date();

    // STATUS FLOW: pending -> confirmed -> completed OR cancelled
    this.status = data.status || 'pending';

    // Pricing
    this.price_per_min = typeof data.price_per_min === 'number' ? data.price_per_min : 1000;
    this.reserved_minutes = data.reserved_minutes ?? null;
    this.total_cost = data.total_cost ?? 0;
    this.final_cost = data.final_cost ?? null;

    // Payment: mặc định wallet nếu client không truyền
    this.payment_id = data.payment_id || null;
    this.payment_method = ['wallet','bank_transfer'].includes(data.payment_method)
      ? data.payment_method
      : 'wallet';
  }
  // BUSINESS HELPERS
  isExpired() {
    return this.status === 'pending' && this.expires_at && Date.now() > this.expires_at.getTime();
  }

  requiresPayment() {
    return this.status === 'pending' && !this.payment_id;
  }

  isActive() {
    return this.status === 'confirmed';
  }

  isCompleted() {
    return this.status === 'completed';
  }

  markPaid(payment_id, payment_method = null) {
    this.status = 'confirmed';
    this.payment_id = payment_id;
    if (payment_method && payment_method.trim() !== '') {
      this.payment_method = payment_method;
    }
  }

  complete(final_cost = null) {
    this.status = 'completed';
    if (final_cost !== null) this.final_cost = final_cost;
  }

  cancel() {
    this.status = 'cancelled';
  }

  toJSON() {
    return {
      reservation_id: this.reservation_id,
      user_id: this.user_id,
      station_id: this.station_id,
      point_id: this.point_id,
      connector_type: this.connector_type,
      start_time: this.start_time,
      end_time: this.end_time,
      status: this.status,
      expires_at: this.expires_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
      price_per_min: this.price_per_min,
      reserved_minutes: this.reserved_minutes,
      total_cost: this.total_cost,
      final_cost: this.final_cost,
      payment_id: this.payment_id,
      payment_method: this.payment_method, // ✅ luôn đúng
    };
  }
}

module.exports = Reservation;
