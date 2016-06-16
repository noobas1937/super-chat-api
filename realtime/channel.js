var mongoose = require('mongoose')
    , consts = require('./consts')
    // , node_utils = require('../util/node_utils')
    , caches = require('./caches')
    , redis = require('redis')
    , _ = require('underscore');

//在线用户的所有channelId(一个用户可能多处登录
var peerChannels = exports.peerChannels = {};
//所有连接中的socket
var onlineChannels = exports.onlineChannels = {};

exports.handleNewChannel = function (socket) {

    onlineChannels[socket.id] = socket;

    //登录事件
    socket.on('sign_in', function (requestId, peerId) {
        console.log("用户" + peerId + "已登录.");
        //设置socket的关联peerId
        socket.peerId = peerId;
        //将用户新的在线channel记录到peerChannels中
       if(peerId){
           var chs = peerChannels[peerId];
           if(!_.isArray(chs)){
               peerChannels[peerId] = [socket.id];
           }else{
               if(chs.indexOf(socket.id) < 0){
                   peerChannels[peerId].push(socket.id);
               }
           }

       }

    });

    //返回当前channel的peerId
    socket.on("peer_id", function (requestId) {
        socket.emit('response', requestId, socket.peerId);
    });

    //发送信息
    socket.on("message", function (requestId, message) {
        var msgType = message.type;
        var fromUserId = message.fromUserId;
        var toUserId = message.toUserId;
        var affairId = message.affairId;
        if(msgType.indexOf("chat") == 0){
            if(msgType.indexOf("chat") == 0){
                caches.ifPeerAffairRelation(fromUserId, toUserId, affairId).then(function (res) {
                    if(res){//如果聊天的双发在同一个affair中
                        //TODO 发送消息

                    }else{
                        //TODO 需要报错么
                    }
                });
            }else if(msgType.indexOf("group")){
                //TODO 查询所有在组中的信息
            }
        }
    });

    //离线事件
    socket.on('disconnect', function () {
        console.log('channel closed');
        exports.clearChannel(socket);
    });
};


function isOnline(peerId){
    return peerChannels.hasOwnProperty(peerId);
};

/**
 * 返回在线用户的id
 */
exports.getOnlineChannelPeerIds = function () {
    return new Promise(function (resolve, reject) {
        var keys = _.chain(peerChannels).keys().filter(function (key) {
            //TODO 暂时不做任何筛选
        }).compact().unique().value();
        if(keys.length > 50){
            keys = keys.subItems(0, 50);
        }
        resolve(keys);
    });
};

exports.clearChannel = function (ch) {
    if(ch && ch.peerId && ch.id){
        //第一步删除peerChannels中的信息
        var chs = peerChannels[ch.peerId];
        if(_.isArray(chs)){
            chs.remove(ch.id);
            if(chs.length < 1){
                delete peerChannels[ch.peerId];
            }
        }
        //第二部删除该channel
        delete onlineChannels[ch.id];
    }
}