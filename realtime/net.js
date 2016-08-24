var net = require('net'),
    _ = require('underscore'),
    commonUtils = require('../util/common-utils'),
    peerConnections = [],
    channelService = require('./channel');

require('../util/betterjs');


var hostIpList = ['192.168.1.132', '192.168.1.100'];
var server;



exports.init = function () {
    //获得本机Ip并尝试连接其他主机
    var selfIp = commonUtils.getIpAddress();
    console.log('-----------本机的ip为---------');
    console.log(selfIp);
    console.log('----------------------------');

    // hostIpList.remove(selfIp);

    _.each(hostIpList, function (ip) {
    if(ip != selfIp){
        var client = net.connect({host: ip, port: 8888}, function () {
            //TODO 处理连接
            console.log('Net连接到host: ' + ip + ' port: 8888成功!');
            peerConnections[ip] = client;
        });
        client.on('data', function (data) {
            var msg = JSON.parse(data);

            channelService.sendMessageToPeer(msg, msg['toUserId']);
            console.log('发送消息toUserId: ' + msg['toUserId']);
            // channelService.sendMessageToAffairPeer()
        });
        client.on('error',function () {//如果连接不上
            if(server == null) {//如果本机上还没有server
                createServer();
            }
            client = null;
        });
    }
    });

}

function createServer(){
    server = net.createServer(function (sock) {
        var remoteAddr = sock.remoteAddress;
        var remotePort = sock.remotePort;

        //从IpV6地址获得IpV4地址
        remoteAddr = remoteAddr.split(':')[3];

        peerConnections[remoteAddr] = sock;

    });
    server.listen(8888, function () {
        console.log('本机开启Net服务器post: ' + commonUtils.getIpAddress() + ' port: 8888成功!');
    });
}


exports.sendMessage = function (msg) {
    var toUserId = msg['toUserId'];
    var tag = toUserId.substr(toUserId.length-1, 1);
    tag = Number(tag);
    tag = tag % 2;


    console.log('投递信息toUserId: ' + toUserId);

    var client = peerConnections[hostIpList[tag]];

    if(client != undefined){
        client.write(JSON.stringify(msg));
    }else{

    }

};

exports.checkHost = function (userId) {
    var tag = userId.substr(userId.length-1, 1);
    tag = Number(tag);
    tag = tag % 2;
    if(hostIpList[tag] == commonUtils.getIpAddress()){
        return true;
    }
    return false;
};


// exports.init();



