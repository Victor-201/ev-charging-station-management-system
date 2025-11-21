export const RMQ_QUEUES = {
  CHARGER : 'charger_availability_queue',
  STATION : 'points_status_queue',
  PAYMENT : 'payment_queue',
};

export const RMQ_ROUTING_KEYS = {
  CHARGER : 'charger.availability',
  STATION : 'points.status',
  PAYMENT: [
    'payment.booking.succeeded',
    'payment.booking.failed',
    'payment.charging.succeeded',
    'payment.charging.failed'
  ],
};
