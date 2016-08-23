var net = require('net'),
    _ = require('underscore'),
    commonUtils = require('../util/common-utils'),
    peerConnections = [];


var hostIpList = ['localhost', 'localhost1', 'localhost2'];
var server;



exports.init = function () {
    //获得本机Ip并尝试连接其他主机
    var selfIp = commonUtils.getIpAddress();
    hostIpList.remove(selfIp);

    _.each(hostIpList, function (ip) {
        var client = net.connect({host: ip, port: 8888}, function () {
            //TODO 处理连接
            peerConnections[ip] = client;
        });
        client.on('error',function () {//如果连接不上
            if(server == null) {//如果本机上还没有server
                createServer();
            }
            client = null;
        });


    });

}

function createServer(){
    server = net.createServer(function () {

    });
    server.listen(8888, function () {

    });
}



