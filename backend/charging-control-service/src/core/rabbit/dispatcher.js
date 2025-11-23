const BookingService = require('../../services/BookingService.js');
const ChargingService = require('../../services/ChargingService.js');

class PaymentDispatcher {
  async handleEvent(routingKey, payload) {
    if (routingKey.startsWith('payment.booking.')) {
      await BookingService.handlePaymentEvent(routingKey, payload);
    } else if (routingKey.startsWith('payment.charging.')) {
      await ChargingService.handlePaymentEvent(routingKey, payload);
    } else {
      console.warn('[Dispatcher] Unknown payment event:', routingKey);
    }
  }
}

module.exports = new PaymentDispatcher();
