var mongoose = require('mongoose')
    , consts = require('./consts')
// , node_utils = require('../util/node_utils')
    , caches = require('./caches')
    , redis = require('redis')
    , _ = require('underscore')
    , Message =require('./models').Message;

//在线用户的所有channelId(一个用户可能多处登录
var peerChannels = exports.peerChannels = {};
//所有连接中的socket
var onlineChannels = exports.onlineChannels = {};


/**
 * 给单个人发送信息
 */
exports.sendMessageToPeer = function (message, toPeerId) {  //此处的peerId应该就是RoleId
    var chs = peerChannels[toPeerId];
    if (_.isArray(chs)) { //如果这人个在线
        _.each(chs, function (chId) {
            var ch = onlineChannels[chId];
            if (ch & ch.connected) {
                try {
                    ch.emit('message', message);
                } catch (e) {
                }
            }
        });
    }
};

/**
 * 向一个affair之下的用户发送消息
 * @param fromRole
 * @param toRole
 * @param affairId
 * @param message
 * @param msg
 */
exports.sendMessageToAffairPeer = function (fromRole, toRole, affairId, message, msg) {
    caches.ifPeerAffairRelation(fromRole, toRole, affairId)
        .then(function (res) {
            if (res) {//如果聊天的双发在同一个affair中
                exports.sendMessageToPeer(message, toRole);
                msg[key] = exports.getKeyUtil(fromRole, toRole);
                msg.save();
            } else {
                //TODO 需要报错么
            }
        }, function (error) {

        });
};

/**
 * 发送好友信息
 * @param fromRole
 * @param toRole
 * @param message
 * @param msg
 */
exports.sendMessageToFriend = function (fromRole, toRole, message, msg) {
    caches.ifPeerFriendRelation(fromRole, toRole).then(function (res) {
        if (res) {
            exports.sendMessageToPeer(message, toRole);
            msg[key] = exports.getKeyUtil(fromRole, toRole);
            msg.save();
        }
    }, function (error) {

    });
};


/**
 * 向多人发送信息
 */
exports.sendMessageToMultiplePeers = function (message, toPeerIds) {
    _.each(toPeerIds, function (peerId) {
        exports.sendMessageToPeer(message, peerId);
    });
};


/**
 * 发送Group消息
 */
exports.sendMessageToGroup = function (message, roleId, groupId, msg) {
    return new Promise(function (resolve, reject) {
        caches.ifPeerInGroup(roleId, groupId)
            .then(function (res) {
                if (res) {  //如果给Group发送信息的人在Group中 则给Group中所有在线的人员发送消息
                    var groupPeers = caches.getGroupMemberRoleIds(groupId);
                    exports.sendMessageToMultiplePeers(message, groupPeers);
                    msg['key'] = groupId; //如果是群发消息则将groupId设为key
                    msg.save();
                    resolve('ok');
                } else {
                    reject(new Error('No Permission: 用户不在当前Group中'));
                }
            }, function (error) {
                reject(error);
            });
    });
};

exports.handleNewChannel = function (socket) {

    onlineChannels[socket.id] = socket;

    //登录事件
    socket.on('sign_in', function (token, peerId) {  //预留token给以后做验证
        console.log("用户" + peerId + "已登录.");
        //设置socket的关联peerId
        socket.peerId = peerId;
        //将用户新的在线channel记录到peerChannels中
        if (peerId) {
            var chs = peerChannels[peerId];
            if (!_.isArray(chs)) {
                peerChannels[peerId] = [socket.id];
            } else {
                if (chs.indexOf(socket.id) < 0) {
                    peerChannels[peerId].push(socket.id);
                }
            }

        }

    });

    //返回当前channel的peerId
    socket.on('peer_id', function (requestId) {
        socket.emit('response', requestId, socket.peerId);
    });

    /**
     * 发送信息
     */
    socket.on('message', function (requestId, message) {
        var msgJson = JSON.parse(message);
        
        var msgType = msgJson['type'];
        var fromRole = msgJson['fromRole'];
        var toRole = msgJson['toRole'];
        var affairId = msgJson['affairId'];
        var groupId = msgJson['groupId'];
        
        var msg = new Message({
            type : msgType,
            timestamp: new Date(),
            fromId: msgJson['fromId'],
            fromRole: fromRole,
            affairId: affairId,
            toUserId: msgJson['toUserId'],
            toRole: toRole,
            content: message
        });
        
        if (msgType.indexOf("chat") == 0) {
            if (affairId == consts.friend_key) {  //如果affairId = 'friend'那么是朋友间聊天
                exports.sendMessageToFriend(fromRole, toRole, message);
            } else {
                exports.sendMessageToAffairPeer(fromRole, toRole, affairId, message);
            }
        } else if (msgType.indexOf('group')) { //如果发送的是群聊信息
            exports.sendMessageToGroup(message, groupId);
        } else if (msgType.indexOf('multi')) {
            var toRoleIds = message.toRoleIds;
            if (affairId == consts.friend_key) {  //如果affairId = 'friend' 那么是朋友聊天
                _.each(toRoleIds, function (roleId) {
                    exports.sendMessageToFriend(fromRole, roleId, message);
                });
            } else {
                _.each(toRoleIds, function (roleId) {
                    exports.sendMessageToAffairPeer(fromRole, roleId, affairId, message);
                });
            }
        }
    });
    

    /**
     * 获得当前在连socket数量
     */
    socket.on('online_channels_count', function (requestId) {
        socket.emit('response', requestId, _.keys(onlineChannels).length);
    });

    /**
     * 获得当前在peers数字
     */
    socket.on('online_peer_count', function (requestId) {
        socket.emit('response', requestId, _.keys(onlineChannels).length);
    });

    /**
     * 查看peer的在线状态
     */
    socket.on('peers_status', function (requestId, peers) {
        var result = [];
        _.each(peers, function (peer) {
            if (_.isArray(peerChannels[peer] && peerChannels[peer].length > 0)) {
                result.push(true);
            } else {
                result.push(false);
            }
        });
        socket.emit('response', requestId, result);
    });

    //离线事件
    socket.on('disconnect', function () {
        console.log('channel closed');
        exports.clearChannel(socket);
    });
};


function isOnline(peerId) {
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
        if (keys.length > 50) {
            keys = keys.subItems(0, 50);
        }
        resolve(keys);
    });
};


/**
 * 获得两人之前的聊天的key的Util方法
 * @param roleId_1
 * @param roleId_2
 * @returns {string}
 */
exports.getKeyUtil = function (roleId_1, roleId_2){
    return roleId_1 <= roleId_2 ? (roleId_1 + '@' + roleId_2) : (roleId_2 + '@' + roleId_1);
};

exports.clearChannel = function (ch) {
    if (ch && ch.peerId && ch.id) {
        //第一步删除peerChannels中的信息
        var chs = peerChannels[ch.peerId];
        if (_.isArray(chs)) {
            chs.remove(ch.id);
            if (chs.length < 1) {
                delete peerChannels[ch.peerId];
            }
        }
        //第二步删除该channel
        delete onlineChannels[ch.id];
    }
}