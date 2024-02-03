type EventHandler = (...args: any[]) => void;
/**
 * YNB 事件总线
 */
export class YNBEventBus {
  private static instance: YNBEventBus;

  static get shared(): YNBEventBus {
    if (!YNBEventBus.instance) {
      YNBEventBus.instance = new YNBEventBus();
    }
    return YNBEventBus.instance;
  }

  events: { id: any; handler: EventHandler }[] = [];

  subscribe(handler: EventHandler) {
    let len = this.events.length;
    const id = ++len;
    this.events.push({ id, handler });

    return id;
  }

  unsubscribe(id: any) {
    this.events = this.events.filter((subscriber) => subscriber.id !== id);
  }

  emit(...args: any[]) {
    this.events.forEach((subscriber) => {
      subscriber.handler.apply(null, args);
    });
  }
}
