import { EventEmitter } from 'events';

/**
 * LocalEventBus
 * ------------------------------
 * Event bus nội bộ cho communication giữa các service cùng process
 * (thay thế RabbitMQ cho môi trường local hoặc monolith)
 */
class LocalEventBus extends EventEmitter {
  publish(event, data) {
    this.emit(event, data);
  }

  subscribe(event, listener) {
    this.on(event, listener);
  }
}

const localBus = new LocalEventBus();
export default localBus;
