var mongoose = require('mongoose')
    , consts = require('./consts')
// , node_utils = require('../util/node_utils')
    , caches = require('./caches')
    , redis = require('redis')
    , _ = require('underscore')
    , Message = require('./models').Message
    , LastReadTime = require('./models').LastReadTime
    , messageService = require('./message')
    , push = require('../push/pushNotice/push');

//在线用户的所有channelId(一个用户可能多处登录
var peerChannels = exports.peerChannels = {};
//所有连接中的socket
var onlineChannels = exports.onlineChannels = {};


/**
 * 给单个人发送信息
 */
exports.sendMessageToPeer = function (message, toPeerId) {
    return new Promise(function (resolve, reject) {
        var chs = peerChannels[toPeerId];
        if (_.isArray(chs)) { //如果这人个在线
            _.each(chs, function (chId) {
                var ch = onlineChannels[chId];
                if (ch) {
                    try {
                        ch.emit('message', message);
                        resolve(true);
                    } catch (e) {
                        reject(e);
                    }
                }
            });
        }
        else{
            push.pushNotice(message);
        }
    });
};

/**
 * 向一个affair之下的用户发送消息
 * @param fromRole
 * @param toRole
 * @param affairId
 * @param message
 * @param msg
 */
exports.sendMessageToAffairPeer = function (fromRole, toUserId, toRole, affairId, message, msg) {
    return new Promise(function (resolve, reject) {
        caches.ifPeerAffairRelation(fromRole, toRole, affairId)
            .then(function (res) {
                if (res) {//如果聊天的双发在同一个affair中
                    console.log('------------用户在同一个affair中并发送信息--------------');
                    exports.sendMessageToPeer(message, toUserId);
                    console.log('------------准备save msg--------------');
                    msg.save(function (error, res) {
                        if(error){
                            reject(error);
                        }else{
                            resolve(res);
                        }
                    });
                } else {
                    reject(new Error('No permission: 两个User Role不在同一个事务中.'));
                }
            }, function (error) {
                console.log('------------caches层发生错误--------------');
                reject(error);
            });
    });
};

/**
 * 发送好友信息
 * @param fromRole
 * @param toRole
 * @param message
 * @param msg
 */
exports.sendMessageToFriend = function (fromRole, toUserId, toRole, message, msg) {
    return new Promise(function (resolve, reject) {
        caches.ifPeerFriendRelation(fromRole, toRole).then(function (res) {
            if (res) {
                exports.sendMessageToPeer(message, toUserId);
                msg.save(function (error) {
                    reject(error);
                }, function (res) {
                    resolve(res);
                });
            }
        }, function (error) {
            reject(error);
        });
    });
};


/**
 * 向多人发送信息
 */
exports.sendMessageToMultiplePeers = function (message, toPeerIds) {
    console.log('------------开始群发信息啦--------------');
    _.each(toPeerIds, function (peerId) {
        exports.sendMessageToPeer(message, peerId);
    });
};


/**
 * 发送Group消息
 */
exports.sendMessageToGroup = function (fromId, groupId, message, msg) {
    return new Promise(function (resolve, reject) {
        console.log('------------判断发送者是否在当前group中--------------');
        caches.ifPeerInGroup(fromId, groupId)
            .then(function (res) {
                if (res) {  //如果给Group发送信息的人在Group中 则给Group中所有在线的人员发送消息
                    caches.getGroupMemberList(groupId).then(function (data) {
                        console.log('------------开始发送信息--------------');
                        exports.sendMessageToMultiplePeers(message, data);
                    }, function (error) {

                    });

                    msg['key'] = groupId; //如果是群发消息则将groupId设为key
                    msg.save(function (error, res) {
                        if(error){
                            reject(error);
                        }else{
                            resolve(res);
                        }
                    });
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

    /**
     * @param requestId 随机生成
     * @param token 做验证
     * @param peerId user_id
     * @param userAgent socket的客户端信息
     */
    socket.on('sign_in', function (requestId, token, peerId, userAgent) {  //预留token给以后做验证
        console.log("用户" + peerId + "已登录.");
        //设置socket的关联peerId和相关的userAgent
        socket.peerId = peerId;
        socket.userAgent = userAgent;
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

    /**
     * 发送信息
     * @param requestId 随机生成
     * @Param message 消息体
     */
    socket.on('send_message', function (requestId, message) {

        var msgType = message.type;
        var fromId = message.fromId;
        var fromRole = message.fromRole;
        var toUserId = message.toUserId;
        var toRole = message.toRole;
        var affairId = message.affairId;
        var groupId = message.groupId;

        //MessageSchema生成msg
        var msg = new Message({
            'timestamp': Date.now(),
        });
        var keys = _.keys(message);
        _.each(keys, function(key){
            msg[key] = message[key];
        });


        //给要转发的消息加上时间戳
        var serverTimestamp = new Date();
    

        if (msgType == 1) {//单人聊天
            if (affairId == consts.friend_key) {  //朋友聊天
                exports.sendMessageToFriend(fromRole, toUserId, toRole, message, msg)
                    .then(function (res) {
                        var m_res = {'id': res, 'time': serverTimestamp, 'requestId': requestId};
                        socket.emit('response', m_res);
                    }, function (error) {
                        socket.emit('response', {'requestId': requestId, 'error': error});
                    });
            } else {//事务内聊天
                console.log('------------进行affair聊天--------------');
                exports.sendMessageToAffairPeer(fromRole, toUserId, toRole, affairId, message, msg)
                    .then(function (res) {
                        console.log('------------信息save成功--------------');
                        var m_res = {'id': res._id, 'time': serverTimestamp, 'requestId': requestId};
                        socket.emit('response', m_res);
                    }, function (error) {
                        console.log('------------信息save失败--------------');
                        socket.emit('response', {'requestId': requestId, 'error': error});
                    });
            }
        } else if (msgType == 2) {//群组聊天
            exports.sendMessageToGroup(fromId, groupId, message, msg)
                .then(function (res) {
                    var m_res = {'id': res._id, 'time': serverTimestamp, 'requestId': requestId};
                    socket.emit('response', m_res);
                }, function (error) {
                    socket.emit('response', {'requestId': requestId, 'error': error});
                });
        } else if (msgType == 4) {//发送多人信息聊天
            var toUserIds = message.toUserIds;
            var toRoleIds = message.toRoleIds;
            if (affairId == consts.friend_key) {//朋友聊天
                var index = 0;
                _.each(toUserIds, function (m_toUserId) {
                    var m_toRole = toRoleIds[index++];
                    exports.sendMessageToFriend(fromRole, m_toUserId, m_toRole, message, msg)
                        .then(function (res) {
                            var m_res = {'id': res._id, 'time': serverTimestamp, 'requestId': requestId};
                            socket.emit('response', m_res);
                        }, function (error) {
                            socket.emit('response', {'requestId': requestId, 'error': error});
                        });
                });
            } else {//事务内聊天
                var index = 0;
                _.each(toUserIds, function (m_toUserId) {
                    var m_toRole = toRoleIds[index++];
                    exports.sendMessageToAffairPeer(fromRole, m_toUserId, m_toRole, affairId, message, msg)
                        .then(function (res) {
                            var m_res = {'id': res, 'time': serverTimestamp, 'requestId': requestId};
                            socket.emit('response', m_res);
                        }, function (error) {
                            socket.emit('response', {'requestId': requestId, 'error': error});
                        });
                });
            }
        }
    });

    /**
     * @param requestId
     * @param peerId
     */
    socket.on('peers_status', function (requestId, peerId) {
        var clients = [];
        var chs = peerChannels[peerId];
        if(_.isArray(chs) && chs.length > 0){
            _.each(chs, function (chId) {
                if(onlineChannels[chId]){
                    clients.push({
                        'userAgent': onlineChannels[chId].userAgent //TODO 还需要socket的ip信息么
                    });
                }
            });
        }

        var msg = {
            'requestId': requestId,
            'clients': clients
        };

        socket.emit('peers_status_response', msg);


    });

    /**
     * @param requestId 随机生成
     * @param beginTime 默认为空(起始
     * @param endTime 默认为当前时间(结束
     * @param limit 条数
     * @param filters 筛选条件
     */
    socket.on('find_message', function (requestId, beginTime, endTime, limit, filters) {
        messageService.findMessage(beginTime, endTime, limit, filters)
            .then(function (res) {
                socket.emit('message_history', {'requestId': requestId, 'list': res});
        }, function (error) {
            socket.emit('message_history', {'requestId': requestId, 'error': error});
        });
    });

    /**
     * @param peerId userId
     * @param filters 是单人聊天还是多人聊
     */
    socket.on('mark_read_time', function (peerId, filters) {
        messageService.markReadTime(peerId, filters);
    });

    /**
     * @param requestId 随机生成
     * @param peerId userId
     * @param filters 筛选条件
     */
    socket.on('unread_message_count', function (requestId, peerId, filters) {
        messageService.getUnreadMessageCount(peerId, filters).then(function (res) {
            socket.emit('response', {'requestId': requestId, 'count': res});
        }, function (error) {
            socket.emit('response', {'requestId': requestId, 'error': error});
        });
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