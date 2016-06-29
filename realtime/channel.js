var mongoose = require('mongoose')
    , consts = require('./consts')
// , node_utils = require('../util/node_utils')
    , caches = require('./caches')
    , redis = require('redis')
    , _ = require('underscore')
    , Message = require('./models').Message
    , messageService = require('./message');

//在线用户的所有channelId(一个用户可能多处登录
var peerChannels = exports.peerChannels = {};
//所有连接中的socket
var onlineChannels = exports.onlineChannels = {};


/**
 * 给单个人发送信息
 */
exports.sendMessageToPeer = function (message, toPeerId) {
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
exports.sendMessageToAffairPeer = function (fromRole, toUserId, toRole, affairId, message, msg) {
    return new Promise(function (resolve, reject) {
        caches.ifPeerAffairRelation(fromRole, toRole, affairId)
            .then(function (res) {
                if (res) {//如果聊天的双发在同一个affair中
                    exports.sendMessageToPeer(message, toRole);
                    msg[key] = exports.getKeyUtil(fromRole, toRole);
                    msg.save(function (error) {
                        reject(error);
                    }, function (res) {
                        resolve(res);
                    });
                } else {
                    //TODO 需要报错么
                    reject(new Error('No permission: 两个User Role不在同一个事务中.'));
                }
            }, function (error) {

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
                exports.sendMessageToPeer(message, toRole);
                msg[key] = exports.getKeyUtil(fromRole, toRole);
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
    _.each(toPeerIds, function (peerId) {
        exports.sendMessageToPeer(message, peerId);
    });
};


/**
 * 发送Group消息
 */
exports.sendMessageToGroup = function (requestId, message, roleId, groupId, msg) {
    return new Promise(function (resolve, reject) {
        caches.ifPeerInGroup(roleId, groupId)
            .then(function (res) {
                if (res) {  //如果给Group发送信息的人在Group中 则给Group中所有在线的人员发送消息
                    var groupPeers = caches.getGroupMemberList(groupId);
                    exports.sendMessageToMultiplePeers(message, groupPeers);
                    msg['key'] = groupId; //如果是群发消息则将groupId设为key
                    msg.save(function (error) {
                        reject(error);
                    }, function (res) {
                        resolve(res);
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
        var msgJson = JSON.parse(message);

        var msgType = msgJson['type'];
        var fromRole = msgJson['fromRole'];
        var toUserId = msgJson['toUserId'];
        var toRole = msgJson['toRole'];
        var affairId = msgJson['affairId'];
        var groupId = msgJson['groupId'];

        var msg = new Message({
            type: msgType,
            timestamp: new Date(),
            fromId: msgJson['fromId'],
            fromRole: fromRole,
            affairId: affairId,
            toUserId: msgJson['toUserId'],
            toRole: toRole,
            content: message
        });


        //给要转发的消息加上时间戳
        var serverTimestamp = new Date();
        msgJson.timestamp = serverTimestamp;
        message = JSON.stringify(msgJson);

        if (msgType.indexOf("chat") == 0) {//单人聊天
            if (affairId == consts.friend_key) {  //朋友聊天
                exports.sendMessageToFriend(fromRole, toUserId, toRole, message, msg)
                    .then(function (res) {
                        var m_res = {'id': res, 'time': serverTimestamp, 'requestId': requestId};
                        socket.emit('message_response', m_res);
                    }, function (error) {
                        socket.emit('message_response', error);
                    });
            } else {//事务内聊天
                exports.sendMessageToAffairPeer(fromRole, toUserId, toRole, affairId, message, msg)
                    .then(function (res) {
                        var m_res = {'id': res, 'time': serverTimestamp, 'requestId': requestId};
                        socket.emit('message_response', m_res);
                    }, function (error) {
                        socket.emit('message_response', error);
                    });
            }
        } else if (msgType.indexOf('group')) {//群组聊天
            exports.sendMessageToGroup(message, groupId)
                .then(function (res) {
                    var m_res = {'id': res, 'time': serverTimestamp, 'requestId': requestId};
                    socket.emit('message_response', m_res);
                }, function (error) {
                    socket.emit('message_response', error);
                });
        } else if (msgType.indexOf('multi')) {//发送多人信息聊天
            var toUserIds = msgJson['toUserIds'];
            var toRoleIds = msgJson['toRoleIds'];
            if (affairId == consts.friend_key) {//朋友聊天
                var index = 0;
                _.each(toUserIds, function (m_toUserId) {
                    var m_toRole = toRoleIds[index++];
                    exports.sendMessageToFriend(fromRole, m_toUserId, m_toRole, message, msg)
                        .then(function (res) {
                            var m_res = {'id': res, 'time': serverTimestamp, 'requestId': requestId};
                            socket.emit('message_response', m_res);
                        }, function (error) {
                            socket.emit('message_response', error);
                        });
                });
            } else {//事务内聊天
                var index = 0;
                _.each(toUserIds, function (m_toUserId) {
                    var m_toRole = toRoleIds[index++];
                    exports.sendMessageToAffairPeer(fromRole, m_toUserId, m_toRole, affairId, message, msg)
                        .then(function (res) {
                            var m_res = {'id': res, 'time': serverTimestamp, 'requestId': requestId};
                            socket.emit('message_response', m_res);
                        }, function (error) {
                            socket.emit('message_response', error);
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
            socket.emit('message_history', error);
        });
    });

    /**
     * @param peerId userId
     * @param filters 是单人聊天还是多人聊天????  这里我觉得应该放在取channel
     */
    socket.on('mark_read_time', function (peerId, filters) {

    });

    /**
     * @param requestId 随机生成
     * @param peerId userId
     * @param filters 筛选条件
     */
    socket.on('unread_message_count', function (requestId, peerId, filters) {
        
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
exports.getKeyUtil = function (roleId_1, roleId_2) {
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