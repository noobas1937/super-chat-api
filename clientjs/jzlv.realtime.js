/**
 * realtime service api wrapper based on LeanCloud or jznet, one public service and one private service
 * TODO: now only provide api based on LeanCloud for stability
 *
 * peer id is user-client-settled string that match unique user connection, maybe you would use user-id/username/email as peer id
 */
(function() {
    var exports = this.jzrealtime = {};
    var appId = 'p1kdylvga8zjdeekjtzr3i10nib6gu3xxawklm8hpkec1lah'; // FIXME: default app id
    var rt = null;
    var onlineFlag = false;
    exports.setAppId = function(_appId) {
        appId = _appId;
    };
    var signInPromise = null;
    /**
     * connect to realtime server
     * @param peerId
     */
    exports.signIn = function(peerId) {
        if(signInPromise) {
            return signInPromise;
        }
        signInPromise = new Promise(function(resolve, reject) {
            rt = AV.realtime({
                appId: appId,
                clientId: peerId
            });
            rt.on('open', function() {
                onlineFlag = true;
                resolve(exports, rt, arguments);
            });
        });
        return signInPromise;
    };
    exports.isConnected = function() {
        return onlineFlag;
    };
    exports.onReUse = function(callback) {
        rt.on('resue', callback);
    };
    exports.createRoom = function(name, members, options) {
        members = members || [];
        options = options || {};
        return new Promise(function(resolve, reject) {
            rt.room(_.extend({
                members: members,
                data: {
                    name: name
                }
            }, options), function(data) {
                console.log('conversation created', data);
                resolve(data.id);
            });
        });
    };
    exports.findRoom = function(id) {
        return new Promise(function(resolve, reject) {
            rt.room(id, function(room) {
                if(room) {
                    resolve(room);
                } else {
                    reject("This room not existed");
                }
            });
        });
    };
    exports.joinRoom = function(room) {
        return new Promise(function(resolve, reject) {
            room.join(resolve);
        });
    };
    exports.removeUserFromRoom = function(room, peerId) {
        return new Promise(function(resolve, reject) {
            room.remove(peerId, resolve);
        });
    };
    /**
     * get total members count of room(include online and offline users)
     * @param room
     */
    exports.getRoomMembersCount = function(room) {
        return new Promise(function(resolve, reject) {
            room.count(resolve);
        });
    };
    exports.addMemberToRoom = function(room, peerId) {
        return new Promise(function(resolve, reject) {
            room.add(peerId, resolve);
        });
    };

    exports.listRoomMembers = function(room) {
        return new Promise(function(resolve, reject) {
            room.list(resolve);
        });
    };
    var watchingMessageRoomsCallbacks = {};
    exports.watchRoomMessages = function(room, callback) {
        if(watchingMessageRoomsCallbacks[room.id]) {
            watchingMessageRoomsCallbacks[room.id].push(callback);
        } else {
            watchingMessageRoomsCallbacks[room.id] = [callback];
            room.receive(function(data) {
                _.each(watchingMessageRoomsCallbacks[room.id], function(cb) {
                    cb(data);
                });
            });
        }
        return exports;
    };
    exports.clearRoomMessageWatchers = function(room) {
        watchingMessageRoomsCallbacks[room.id] = undefined;
    };
    exports.watchRoomsJoin = function(callback) {
        rt.on('join', function(data) {
            callback(data);
        });
    };
    exports.onClose = function(callback) {
        rt.on('close', function(data) {
            callback(data);
        });
    };
    /**
     * *
     * @param peerIdsOrPeerId
     */
    exports.getPeerStatus = function(peerIdsOrPeerId) {
        return new Promise(function(resolve, reject) {
            rt.ping(peerIdsOrPeerId, function(data) {
                resolve(data);
            });
        });
    };
    exports.sendTextToRoom = function(room, msg) {
        return new Promise(function(resolve, reject) {
            room.send({
                text: msg
            }, {
                type: 'text'
            }, resolve);
        });
    };
    exports.getHistoryOfRoom = function(room, limit, maxTimestamp, exceptMessageId) {
        limit = limit || 20;
        maxTimestamp = maxTimestamp || new Date().getTime();
        return new Promise(function(resolve, reject) {
            room.log({
                limit: limit,
                mid: exceptMessageId,
                t: maxTimestamp
            }, resolve);
        });
    };
    exports.markRoomLastReadTime = function (room) {
        return new Promise(function (resolve, reject) {
            reject('not supported operation');
        });
    };
    exports.getUnreadMessagesCountOfRoom = function (room, filters) {
        return new Promise(function (resolve, reject) {
            reject('not supported operation');
        });
    };
    exports.getHistoryOfRoomWithFilter = function (room, limit, maxTimestamp, filters) {
        limit = limit || 50;
        maxTimestamp = maxTimestamp || new Date().getTime();
        return new Promise(function (resolve, reject) {
            reject('not supported operation');
        });
    };
    exports.leaveRoom = function(room) {
        return new Promise(function(resolve, reject) {
            room.leave(resolve);
        });
    };
    exports.close = function() {
        return new Promise(function(resolve, reject) {
            rt.close();
            resolve();
        });
    };

    // TODO: get room's online users count，send message to channel user from backend，please use rest api
})();