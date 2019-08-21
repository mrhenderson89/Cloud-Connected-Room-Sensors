load('api_config.js');
load('api_dht.js');
load('api_timer.js');
load('api_gpio.js');
load('api_adc.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');

let deviceName = 'AntBedroom';
let deviceId = Cfg.get('device.id');
let topic = '/devices/' + deviceId + '/events';
print('Topic: ', topic);

let isConnected = false;

let dhtPin = 4; //D2
let dht = DHT.create(dhtPin, DHT.DHT11);

let pirSensor = 13; //D7
// Blink built-in LED every second
GPIO.set_mode(pirSensor, GPIO.MODE_INPUT);

let getInfo = function() {
  return JSON.stringify({
    deviceName: deviceName,
    temp: dht.getTemp(),
    hum: dht.getHumidity(),
    light: ADC.read(0),
    pir: GPIO.read(pirSensor)
  });
};

Timer.set(
  60 * 60 * 1000,
  true,
  function() {
    if (isConnected) {
      publishData();
    }
  },
  null
);

Timer.set(
  5000,
  true,
  function() {
    print('Info:', getInfo());
  },
  null
);

MQTT.setEventHandler(function(conn, ev) {
  if (ev === MQTT.EV_CONNACK) {
    print('CONNECTED');
    isConnected = true;
    publishData();
  }
}, null);

function publishData() {
  let ok = MQTT.pub(topic, getInfo());
  if (ok) {
    print('Published');
  } else {
    print('Error publishing');
  }
}

// Monitor network connectivity.
Net.setStatusEventHandler(function(ev, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);