/**
 * Created by xmc1993 on 16/6/30.
 */

var io = require('socket.io-client');
var socket = io.connect('ws://localhost:3000');

socket.on("connect", function () {
    console.log('connect to server');
});

socket.emit('sign_in', 'requestId', '123', '8ce1279c-06ca-40df-821e-4f955fb70888', 'web');

var message = {
    'type': 2,
    'fromId': '8ce1279c-06ca-40df-821e-4f955fb70888',
    'fromRole': '5c1bce17-1d60-4f21-a97c-c1c041d5f2f0',
    'groupId': '1c7074f4-8ae9-4dac-89de-673fd740a614',
    'content': '哈哈哈哈哈 你 是 傻 了 吧 '
};

socket.emit('send_message', 'requestId', message);

socket.on('message_response', function (res) {
    console.log('get response!');
    console.log(res);
});