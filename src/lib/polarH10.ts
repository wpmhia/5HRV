export const POLAR_H10_SERVICE_UUID = "fb005c80-02e7-f387-1cad-8acd2d8df0c8";
export const HEART_RATE_SERVICE_UUID = 0x180d;
export const HEART_RATE_MEASUREMENT_UUID = 0x2a37;

export type PolarH10Event = {
  heartRate: number;
  rrIntervalsMs: number[];
};

export function isBluetoothAvailable(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function parseHeartRateMeasurement(view: DataView): PolarH10Event {
  const flags = view.getUint8(0);
  const hr16Bit = (flags & 0x01) !== 0;
  let offset = 1;

  let heartRate: number;
  if (hr16Bit) {
    heartRate = view.getUint16(offset, true);
    offset += 2;
  } else {
    heartRate = view.getUint8(offset);
    offset += 1;
  }

  if (flags & 0x08) offset += 2;

  const rrIntervalsMs: number[] = [];
  if (flags & 0x10) {
    while (offset + 2 <= view.byteLength) {
      const rr = view.getUint16(offset, true);
      offset += 2;
      rrIntervalsMs.push((rr / 1024) * 1000);
    }
  }

  return { heartRate, rrIntervalsMs };
}

export class PolarH10Session {
  private device: BluetoothDevice;
  private server: BluetoothRemoteGATTServer;
  private characteristic: BluetoothRemoteGATTCharacteristic;
  private onEvent: (event: PolarH10Event) => void;

  private constructor(
    device: BluetoothDevice,
    server: BluetoothRemoteGATTServer,
    characteristic: BluetoothRemoteGATTCharacteristic,
    onEvent: (event: PolarH10Event) => void,
  ) {
    this.device = device;
    this.server = server;
    this.characteristic = characteristic;
    this.onEvent = onEvent;
  }

  static async connect(onEvent: (event: PolarH10Event) => void): Promise<PolarH10Session> {
    if (!isBluetoothAvailable()) {
      throw new Error("Web Bluetooth is not supported in this browser. Use Chrome or Edge.");
    }
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [POLAR_H10_SERVICE_UUID] }],
    });
    const gatt = device.gatt;
    if (!gatt) throw new Error("Could not connect to the Polar H10.");
    const server = await gatt.connect();
    const service = await server.getPrimaryService(HEART_RATE_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT_UUID);
    await characteristic.startNotifications();
    const session = new PolarH10Session(device, server, characteristic, onEvent);
    characteristic.addEventListener("characteristicvaluechanged", session.handleValueChanged);
    return session;
  }

  private handleValueChanged = (event: Event): void => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (value) {
      this.onEvent(parseHeartRateMeasurement(value));
    }
  };

  get deviceName(): string {
    return this.device.name ?? "Polar H10";
  }

  disconnect(): void {
    this.characteristic.removeEventListener("characteristicvaluechanged", this.handleValueChanged);
    if (this.server.connected) {
      try {
        this.server.disconnect();
      } catch {
        // ignore disconnect errors
      }
    }
  }
}
