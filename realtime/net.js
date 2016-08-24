var net = require('net'),
    _ = require('underscore'),
    commonUtils = require('../util/common-utils'),
    peerConnections = [];

require('../util/betterjs');


var hostIpList = ['192.168.1.132', '192.168.1.100'];
var server;



exports.init = function () {
    //获得本机Ip并尝试连接其他主机
    var selfIp = commonUtils.getIpAddress();
    console.log('-----------本机的ip为---------');
    console.log(selfIp);
    console.log('----------------------------');

    hostIpList.remove(selfIp);

    _.each(hostIpList, function (ip) {
        var client = net.connect({host: ip, port: 8888}, function () {
            //TODO 处理连接
            console.log('Net连接到host: ' + ip + ' port: 8888成功!');
            peerConnections[ip] = client;
        });
        client.on('data', function (data) {
            console.log('DATA'+ ' : ' + data);
        });
        client.on('error',function () {//如果连接不上
            if(server == null) {//如果本机上还没有server
                createServer();
            }
            client = null;
        });


    });

}

var msg = {
  'name': 'xmc',
    'age': 23
};

function createServer(){
    server = net.createServer(function (sock) {
        var remoteAddr = sock.remoteAddress;
        var remotePort = sock.remotePort;

        //从IpV6地址获得IpV4地址
        remoteAddr = remoteAddr.split(':')[3];

        sock.write(JSON.stringify(msg));
        peerConnections[remoteAddr] = sock;

    });
    server.listen(8888, function () {
        console.log('本机开启Net服务器post: ' + commonUtils.getIpAddress() + ' port: 8888成功!');
    });
}


// exports.init();



