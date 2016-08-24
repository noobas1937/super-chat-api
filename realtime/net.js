var net = require('net'),
    _ = require('underscore'),
    commonUtils = require('../util/common-utils'),
    peerConnections = [];

require('../util/betterjs');


var hostIpList = ['localhost', 'localhost1', 'localhost2'];
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

        console.log('-----------new socket connected-----------');
        console.log(sock);
        console.log(remoteAddr);
        console.log(remotePort);
        console.log('------------------------------------------');
        sock.write(JSON.stringify(msg));
        peerConnections[remoteAddr] = sock;

    });
    server.listen(8888, function () {

    });
}


exports.init();



