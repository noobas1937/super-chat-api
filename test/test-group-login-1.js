/**
 * Created by xmc1993 on 16/6/30.
 */

var io = require('socket.io-client');
var socket = io.connect('ws://192.168.1.100:3000');
socket.on("connect", function () {
    console.log('connect to server');
});

socket.emit('sign_in', 'requestId', '123', 'aafec8d8-2865-410d-a701-eb35efd13e0a', 'web');  //requestId token peerId userAgent


socket.emit('peers_status', 'requestId', 'aafec8d8-2865-410d-a701-eb35efd13e0a');


socket.on('peers_status_response', function (res) {
    console.log('my status is :');
    console.log(res);
});

socket.on('message', function (msg) {
    console.log('收到消息:');
    console.log(msg);
});