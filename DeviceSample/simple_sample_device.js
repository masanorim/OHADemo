// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// Define demo data
var readerIDs=['CR1_Tokyo','CR2_Osaka'];

// String containing Hostname, Device Id & Device Key in the following formats:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>"
var connectionStrings =[
  'HostName=OHA-IOTHub.azure-devices.net;DeviceId=TestCR1;SharedAccessKey=Ifq8RSzKerAK934m4ZQlNj58YCoOuz+JJIVuynGezp4=',
  'HostName=OHA-IOTHub.azure-devices.net;DeviceId=TestCR2;SharedAccessKey=LBklykcLnfubXr1T0Hxi+pYjX7gfFfaN8Q6t8l6oXfE='];

var cardIDs=[
  'ABCD0001','ABCD0002','ABCD0003','ABCD0004','ABCD0005',
  'ABCD0006','ABCD0007','ABCD0008','ABCD0009','ABCD0010'];

// Reader Index for this session
var readerIdx = 0;   // this param is device idx
if( process.argv.length>=3 ){
  readerIdx = process.argv[2]
}
if(readerIdx < 0 || readerIdx >= readerIDs.length){
  readerIdx = 0;
}


var Protocol = require('azure-iot-device-amqp').Amqp;
// Uncomment one of these transports and then change it in fromConnectionString to test other transports
// var Protocol = require('azure-iot-device-amqp-ws').AmqpWs;
// var Protocol = require('azure-iot-device-http').Http;
// var Protocol = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;

// fromConnectionString must specify a transport constructor, coming from any transport package.
var connectionString = connectionStrings[readerIdx];
var client = Client.fromConnectionString(connectionString, Protocol);

var connectCallback = function (err) {
  if (err) {
    console.error('Could not connect: ' + err.message);
  } else {
    console.log('Client connected');
    client.on('message', function (msg) {
      console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
      client.complete(msg, printResultFor('completed'));
      // reject and abandon follow the same pattern.
      // /!\ reject and abandon are not available with MQTT
    });

    // Create a message and send it to the IoT Hub every second
    var sendInterval = setInterval(function () {

      var readerID = readerIDs[readerIdx];
      var cardID = cardIDs[Math.floor(Math.random()* cardIDs.length)];
      var currentTime = new Date();
      var timestr = currentTime.toISOString();
      
      var data = JSON.stringify({ deviceId: readerID, cardID: cardID, timeRec: timestr});
      var message = new Message(data);
      message.properties.add('myproperty', 'myvalue');
      console.log('Sending message: ' + message.getData());
      client.sendEvent(message, printResultFor('send'));
    }, 2000);

    client.on('error', function (err) {
      console.error(err.message);
    });

    client.on('disconnect', function () {
      clearInterval(sendInterval);
      client.removeAllListeners();
      client.open(connectCallback);
    });
  }
};

client.open(connectCallback);

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
}
