import { EventEmitter } from "node:events";

export type BusMessage =
  | { type: "update"; eventId: number; payload: unknown }
  | { type: "announcement"; payload: unknown }
  | { type: "hype"; eventId: number; payload: { hype: number } }
  | { type: "seats"; eventId: number; payload: { taken: number } };

// dev එකේදී hot reload වෙද්දි bus එක දෙපාරක් හැදෙන එක නවත්තන්න globalThis එකේ තියාගන්නවා
const g = globalThis as unknown as { hapninBus?: EventEmitter };
const bus = g.hapninBus ?? new EventEmitter();
bus.setMaxListeners(0);
g.hapninBus = bus;

export const publish = (msg: BusMessage) => bus.emit("msg", msg);

export function subscribe(fn: (msg: BusMessage) => void) {
  bus.on("msg", fn);
  return () => bus.off("msg", fn);
}
