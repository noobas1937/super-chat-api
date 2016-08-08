/**
 * Created by xmc1993 on 16/6/30.
 */

var io = require('socket.io-client');
var socket = io.connect('ws://localhost:3000');

socket.on("connect", function () {
    console.log('connect to server');
});

socket.emit('sign_in', 'requestId', '123', '0f2f6985-1c62-43bd-8301-45fc8bf38ce4', 'web');

var message = {
    'type': 1,
    'fromRole': 'aa8af1fa-bdde-4ecb-a87b-6bcfa91b5ce3',
    'toRole': 'ea0ee39c-3ebf-45f2-8c34-7a594def2150',
    'affairId': '71d97697-b455-4ea3-b112-45d35d7b96ea',
    'content': '哈哈哈哈哈 你 是 傻 了 吧 '
};

socket.emit('send_message', 'requestId', message);

socket.on('response', function (res) {
    console.log('get response!');
    console.log(res);
});
