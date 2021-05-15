# smarthomelib

TypeScript library to integrate various smart home devices with each other. The
core communication is realized with an MQTT broker. The following projects are
using this library:

- [smarthome4loxone](https://github.com/claudiospizzi/smarthome4loxone)
- [smarthome4mystromswitch](https://github.com/claudiospizzi/smarthome4mystromswitch)

## Installation

The library is published on [npmjs.org](https://npmjs.org/smarthomelib), 
install it directly into an npm project by using:

```console
npm install smarthomelib
```

## Features

The whole library is used to enable communication between smart home devices by
using a core MQTT broker. The status and action messages are published to the
MQTT broker with the following format:

### Status Message

Used to publish a device status to the MQTT broker.

```data
<system>/<room>/<device>/<feature>
{ "ts": 1618141403000, "value": <value> }
```

### Action Message

Used to command an action for a device via the MQTT broker.

```data
<system>/<room>/<device>/<feature>/<action>
```

### Base types (interfaces)

The `StatusMessage` type represents a message delivered within the smart home
to update the state of a device feature. For example publish the current
temperature of a room, the playback state of a speaker or the battery charge
level of a device.

```typescript
interface StatusMessage {
    // The device type or smart home system, e.g. loxone, sonos, mystrom, ...
    system: string;
    // The device room, e.g. central, kitchen, bedroom, outside, ...
    room: string;
    // The device name, e.g. loxone-miniserver, sonos-play1, ...
    device: string;
    // The status feature, e.g. temperature, humidity, level, ...
    feature: string;
    // The feature value, e.g. 23.5, true, ...
    value: string | number | boolean;
}
```

Check the following examples of status messages.

```typescript
let statusMessage1 = {
    system: "loxone",
    room: "kitchen",
    device: "touch-switch",
    feature: "temperature",
    value: 23.5
};
let statusMessage2 = {
    system: "mystrom",
    room: "bedroom",
    device: "mystrom-switch-01",
    feature: "relay",
    value: true
};
let statusMessage3 = {
    system: "sonos",
    room: "livingroom",
    device: "sonos-play1",
    feature: "state",
    value: "playing"
};
```

The `ActionMessage` is similar to the status message, but it is used to change
the state of a smart home device. So it's a command to perform an action by the
device.

```typescript
interface StatusMessage {
    // The device type or smart home system, e.g. loxone, sonos, mystrom, ...
    system: string;
    // The device room, e.g. central, kitchen, bedroom, outside, ...
    room: string;
    // The device name, e.g. loxone-miniserver, sonos-play1, ...
    device: string;
    // The status feature, e.g. relay, state, ...
    feature: string;
    // The action to perform
    action: string;
}
```

Check the following examples of action messages.

```typescript
let statusMessage1 = {
    system: "mystrom",
    room: "bedroom",
    device: "mystrom-switch-01",
    feature: "relay",
    action: true
};
let statusMessage2 = {
    system: "sonos",
    room: "livingroom",
    device: "sonos-play1",
    feature: "state",
    action: "play"
};
```

### Base classes

The base classes `SmartHomeServerBase` and `SmartHomeClientBase` are available
to extend the smart home system to a broader range of device types. Check the
linked project for examples.

### MQTT broker client

The `MqttBrokerClient` is used to publish and subscribe events of the MQTT
broker. Both message types (status, action) are supported. If an subscribed
message was received, an event is fired.

### InfluxDB client

The `InfluxDbClient` is used to publish any status messages to an InfluxDB v2.
