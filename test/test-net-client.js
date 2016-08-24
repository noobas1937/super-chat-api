var net = require('net');
var client = net.connect({host: '192.168.1.132', port: 8888}, function() {
    console.log('连接到服务器！');
});
client.on('error',function () {
    console.log('--------失败--------');
    console.log(client);
});
client.on('data', function(data) {
    var msg = JSON.parse(data);
    console.log(msg);
    client.end();
});
client.on('end', function() {
    console.log('断开与服务器的连接');
});