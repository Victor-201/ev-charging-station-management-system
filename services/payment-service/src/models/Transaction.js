export default class Transaction {
  constructor({
    id,
    user_id,
    type,
    amount,
    currency = 'VND',
    method,
    related_id = null,
    external_id = null,
    reference_code = null,
    status = 'pending',
    meta = {},
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.type = type;
    this.amount = parseFloat(amount);
    this.currency = currency;
    this.method = method;
    this.related_id = related_id;
    this.external_id = external_id;
    this.reference_code = reference_code;
    this.status = status;
    this.meta = meta;
    this.created_at = created_at ? new Date(created_at) : new Date();
    this.updated_at = updated_at ? new Date(updated_at) : new Date();
  }

  isPending() {
    return this.status === 'pending';
  }

  isSuccessful() {
    return this.status === 'success';
  }

  markSuccess(extraMeta = {}) {
    this.status = 'success';
    this.meta = { ...this.meta, ...extraMeta };
    this.updated_at = new Date();
  }

  markFailed(reason) {
    this.status = 'failed';
    this.meta = { ...this.meta, reason };
    this.updated_at = new Date();
  }

  markRefunded(details = {}) {
    this.status = 'refunded';
    this.meta = { ...this.meta, refund: details };
    this.updated_at = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      method: this.method,
      related_id: this.related_id,
      external_id: this.external_id,
      reference_code: this.reference_code,
      status: this.status,
      meta: this.meta,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
