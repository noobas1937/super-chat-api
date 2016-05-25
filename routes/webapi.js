var express = require('express')
    , router = express.Router()
    , _ = require('underscore')
    , appService = require('../realtime/apps')
    , roomService = require('../realtime/room')
    , Promise = require('promise')
    , channel = require('../realtime/channel')
    , consts = require('../realtime/consts')
    , RoomInfo = require('../realtime/models').RoomInfo;

var handlers = {
    room_info: function (params) {
        return roomService.getRoomInfo(params.room_id);
    },
    create_room: function (params) {
        var room = new RoomInfo({
            name: params.name,
            members: params.memberPeers,
            creatorId: params.creatorPeerId,
            appKey: params.appKey || '',
            roomKey: params.roomKey || '',
            createTime: Date.now()
        });
        return roomService.saveRoomInfo(room);
    },
    get_or_create_room_by_app_key_and_room_key: function (params) {
        return roomService.getOrCreateRoomByAppKeyAndRoomKey(params.appKey, params.roomKey, params.peerId);
    },
    room_members_count: function (params) {
        return roomService.getRoomMembersCount(params.room_id);
    },
    room_members: function (params) {
        return roomService.getRoomMembers(params.room_id);
    },
    peers_status: function (params) {
        // TODO
        return Promise.reject('not supported now');
    },
    online_peers: function(params) {
        return channel.getOnlineChannelPeerIds(params.app_key);
    },
    send_text_to_room: function (params, appKey) {
        return new Promise(function (resolve, reject) {
            channel.sendTextToRoomFromChannel(null, null, appKey, params.peer_id, params.room_id, params.message, function (res) {
                if (res === false) {
                    reject("Can't find room " + params.room_id);
                } else {
                    resolve(res);
                }
            });
        });
    },
    room_history: function (params) {
        return new Promise(function (resolve, reject) {
            roomService.getRoomHistory(params.room_id, params.limit, params.max_timestamp, params.filters)
                .then(function (records) {
                    resolve({histories: records});
                }, reject);
        });
    },
    message_history_with_filters: function(params) {
        return new Promise(function (resolve, reject) {
            roomService.getMessageHistoryWithFilters(params.limit, params.max_timestamp, params.filters)
                .then(function (records) {
                    resolve({histories: records});
                }, reject);
        });
    },
    room_unread_count: function (params) {
        return roomService.getUnreadMessagesCountOfRoom(params.room_id, params.peer_id, params.filter);
    },
    mark_room_last_read_time: function (params) {
        return roomService.updateRoomPeerLastTime(params.room_id, params.peer_id);
    },
    peer_history: function (params) {
        return new Promise(function (resolve, reject) {
            roomService.getPeerHistory(params.peer_id, params.filters, params.orProperties, params.filterValue, params.limit, params.includeRoomIds)
                .then(function (records) {
                    resolve({histories: records});
                }, reject);
        });
    },
    peer_history_with_unread_top: function (params) {
        return new Promise(function (resolve, reject) {
            roomService.getPeerHistoryWithUnreadTop(params.peer_id, params.filters, params.orProperties, params.filterValue, params.limit, params.includeRoomIds)
                .then(function (data) {
                    resolve(data);
                }, reject);
        });
    },
    /**
     * 批量请求
     * @param params
     */
    batch_request: function (params) {
        return new Promise(function (resolve, reject) {
            if (!_.isArray(params)) {
                reject("wrong batch request format");
                return;
            }
            Promise.all(_.map(params, function (req) {
                return new Promise(function (resolve2, reject2) {
                    if (!_.isObject(req)) {
                        resolve2({success: false, data: "wrong request format"});
                        return;
                    }
                    var method = req.method;
                    var reqParams = req.params;
                    if (!_.isString(method) || !_.isObject(reqParams)) {
                        resolve2({success: false, data: "wrong request format"});
                        return;
                    }
                    var handler = handlers[method];
                    if (!_.isFunction(handler)) {
                        resolve2({success: false, data: "not support method"});
                        return;
                    }
                    handler(reqParams)
                        .then(function (res) {
                            resolve2({success: true, data: res});
                        }, function (err) {
                            resolve2({success: false, data: err});
                        });
                });
            })).then(function (results) {
                resolve(results);
            }, reject);
        });
    }
};

/* GET users listing. */
router.post('/', function (req, res, next) {
    var body = req.body;
    if (!body.method) {
        res.status(501);
        res.end('wrong request body');
        return;
    }
    if (!body.params) {
        res.status(501);
        res.end('request body need params');
        return;
    }
    //调用消息方法
    var handler = handlers[body.method];
    if (_.isFunction(handler)) {
        handler(body.params)
            .then(function (result) {
                res.end(JSON.stringify(result));
            }, function (err) {
                res.end(501, err + '');
            });
    } else {
        res.status(501);
        res.end("Can't find method " + body.method);
    }
});

module.exports = router;
