load('api_config.js');
load('api_dht.js');
load('api_timer.js');
load('api_gpio.js');
load('api_adc.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_i2c.js');
load('api_esp8266.js');

let deviceName = 'PlantSensor';
let deviceId = Cfg.get('device.id');
let topic = '/devices/' + deviceId + '/events';
print('Topic: ', topic);

let isConnected = false;
let hasPublished = false;
let qos = 1;

let dhtPin = 4; //D2
let dht = DHT.create(dhtPin, DHT.DHT11);


let getInfo = function() {
  return JSON.stringify({
    deviceName: deviceName,
    temp: dht.getTemp(),
    hum: dht.getHumidity(),
    soilMoisture: ((ADC.read(0)-212)/223)*-100
  });
};

Timer.set(10000,Timer.REPEAT, function() {
if(isConnected) {
print('Poll Connected');
publishData();
} else {
print('No connection....waiting');
}
},null);

MQTT.setEventHandler(function(conn, ev) {
if(ev !== 0) {
let evs = '???';
  if (ev === MQTT.EV_CONNACK) {
evs = 'CONNACK';
} else if (ev === MQTT.EV_PUBLISH) {
evs = 'PUBLISH';
} else if (ev === MQTT.EV_PUBACK) {
evs = 'PUBACK';
} else if (ev === MQTT.EV_SUBACK) {
evs = 'SUBACK';
} else if (ev === MQTT.EV_UNSUBACK) {
evs = 'UNSUBACK';
} else if (ev === MQTT.EV_CLOSE) {
evs = 'CLOSE';
} 
print('MQTT event: ' + evs);
if(ev === MQTT.EV_CONNACK) {
    isConnected = true;
    publishData();
  } else if (ev === MQTT.EV_PUBACK) {
if(hasPublished) {
print('MQTT Publish confirmed - Init Deep Sleep');
ESP8266.deepSleep(600*600*10000);
//ESP8266.deepSleep(1000);
}
}
}
}, null);

function publishData() {
print(getInfo());
  MQTT.pub(topic, getInfo(), qos);    
print('Published');
	hasPublished = true;
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