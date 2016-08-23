var net = require('net');
var client = net.connect({port: 8888}, function() {
    console.log('连接到服务器！');
});
client.on('error',function () {
    console.log('--------失败--------');
    console.log(client);
});
client.on('data', function(data) {
    console.log(data.toString());
    client.end();
});
client.on('end', function() {
    console.log('断开与服务器的连接');
});