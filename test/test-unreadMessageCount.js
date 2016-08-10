/**
 * Created by xmc1993 on 16/6/30.
 */

var io = require('socket.io-client');
var socket = io.connect('ws://192.168.1.100:3000');
socket.on("connect", function () {
    console.log('connect to server');
});

socket.emit('sign_in', 'requestId', '123', '9ed3838e-6242-4df9-b5b9-b64b47f37e85', 'web');  //requestId token peerId userAgent


socket.emit('peers_status', 'requestId', '9ed3838e-6242-4df9-b5b9-b64b47f37e85');


socket.on('peers_status_response', function (res) {
    console.log('my status is :');
    console.log(res);
});


socket.emit('unread_message_count', '123', '9ed3838e-6242-4df9-b5b9-b64b47f37e85', {'toRole': 'ea0ee39c-3ebf-45f2-8c34-7a594def2150', 'affairId' : '71d97697-b455-4ea3-b112-45d35d7b96ea'});

socket.on('response', function (res) {
    if(res.requestId = 123) {
        console.log('--------------收到find_message------------');
        console.log(res.msg);
        console.log(res.error);
        console.log('--------------收到find_message------------');
    }
});

socket.on('message', function (msg) {
    console.log('收到消息:');
    console.log(msg);
});

