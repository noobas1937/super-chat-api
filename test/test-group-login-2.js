/**
 * Created by xmc1993 on 16/6/30.
 */

var io = require('socket.io-client');
var socket = io.connect('ws://192.168.1.100:3000');
socket.on("connect", function () {
    console.log('connect to server');
});

socket.emit('sign_in', 'requestId', '123', '10524b64-d0cc-4be0-8aff-aa00ecb1084c', 'web');  //requestId token peerId userAgent


socket.emit('peers_status', 'requestId', '10524b64-d0cc-4be0-8aff-aa00ecb1084c');


socket.on('peers_status_response', function (res) {
    console.log('my status is :');
    console.log(res);
});

socket.on('message', function (msg) {
    console.log('收到消息:');
    console.log(msg);
});