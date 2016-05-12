/**
 * peer id is user-client-settled string that match unique user connection, maybe you would use user-id/username/email as peer id
 */
(function () {
    var exports = this.jzrealtime = {};
    var appId = 'p1kdylvga8zjdeekjtzr3i10nib6gu3xxawklm8hpkec1lah'; // FIXME: default app id
    var rt = null;
    var onlineFlag = false;

    function ping(host, pong) {
        host = host.replace(/ws/g, 'http');
        var started = new Date().getTime();
        var http = new XMLHttpRequest();
        http.open("GET", host, true);
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                var endedTime = new Date().getTime();
                var milliseconds = endedTime - started;
                if (pong != null) {
                    debugger;
                    pong(http.status === 200, milliseconds);
                }
            }
        };
        try {
            http.send(null);
        } catch (exception) {
        }
    }

    function pingWebSocket(host, pong) {
        if (host.length > 0 && host[host.length - 1] !== '/') {
            host = host + '/';
        }
        host = host + extraPathForWebsocketUrl;
        var ws = new WebSocket(host);
        var ended = false;
        ws.onopen = function () {
            try {
                if (!ended) {
                    ended = true;
                    pong(true);
                }
            } finally {
                ws.close();
            }
        };
        setTimeout(function () {
            if (ws.readyState !== 1) {
                if (!ended) {
                    ended = true;
                    pong(false);
                }
            }
        }, 1000);
    }

    // start jznet adapter
    //var host = 'ws://115.159.142.231:3000/'; // 115.159.142.231
    //var host = 'ws://localhost:3000/';
    var hosts = window.jzRealtimeHosts || ['ws://115.159.142.231:3000/'];
    //var hosts = ['ws://localhost:3000/', 'ws://localhost:3001/'];
    var extraPathForWebsocketUrl = 'socket.io/?EIO=3&transport=polling';
    var allRoomMessageHandlers = {};
    var connectionOpened = false;
    var onOpenCallbacks = [];
    var onCloseCallbacks = [];
    var onReUseCallbacks = [];
    exports.onOpen = function (callback) {
        if (connectionOpened) {
            callback();
            return;
        }
        onOpenCallbacks.push(callback);
    };
    exports.onClose = function (callback) {
        onCloseCallbacks.push(callback);
    };
    var socket = null;

    function tryToFindServerAndConnect() {
        if (hosts.length === 1) {
            socket = io.connect(hosts[0]);
            afterSocketCreated();
            return;
        }
        var hostIndex = parseInt(Math.random() * hosts.length);
        if (hostIndex >= hosts.length) {
            hostIndex = hosts.length - 1;
        }
        pingWebSocket(hosts[hostIndex], function (res) {
            if (res) {
                socket = io.connect(hosts[hostIndex]);
                afterSocketCreated();
            } else {
                tryToFindServerAndConnect();
            }
        });
    }

    tryToFindServerAndConnect();
    //var socket = io.connect(host);
    function afterSocketCreated() {
        socket.on('connect', function () {
            console.log('jznode connected');
            connectionOpened = true;
            _.each(onOpenCallbacks, function (cb) {
                try {
                    cb();
                } catch (e) {
                }
            });
            //socket.on('message', function(msg) {
            //    console.log('got message ' + msg);
            //});
        });
        socket.on('connect_error', function () {
            console.log('Connection failed');
        });
        socket.on('disconnect', function () {
            console.log('disconnected');
            _.each(onCloseCallbacks, function (cb) {
                exports.signInPromise = null;
                try {
                    cb();
                } catch (e) {
                }
            });
        });
        socket.on('error', function (e) {
            console.log('System', e ? e : 'A unknown error occurred');
        });
        var retrySignIn = _.throttle(function() {
            if(exports.isConnected && currentPeerId) {
                exports.signIn(currentPeerId, true)
                    .then(function() {}, function(){});
            }
        }, 1500);
        socket.on('rt_error', function () {
            console.log('rt error', arguments);
            var params = _.toArray(arguments);
            var requestId = params.shift();
            var cache = cachingRequests[requestId];
            if (!cache) {
                return;
            }
            cache.reject.apply(cache.promise, params);
            retrySignIn();
        });
        socket.on('response', function () {
            var params = _.toArray(arguments);
            var requestId = params.shift();
            var cache = cachingRequests[requestId];
            if (!cache) {
                return;
            }
            cache.resolve.apply(cache.promise, params);
        });
        socket.on('room_message', function (msg) {
            // check room watchers first, then call all-watchers
            if (!msg) {
                return;
            }
            if (msg.roomId) {
                if (msg._id) {
                    msg.id = msg._id;
                }
                var roomCallbacks = watchingMessageRoomsCallbacks[msg.roomId];
                if (_.isArray(roomCallbacks)) {
                    _.each(roomCallbacks, function (cb) {
                        if (cb) {
                            try {
                                cb(msg);
                            } catch (e) {
                                console.error('process room message error', e);
                            }
                        }
                    });
                }
                var hasWatched = roomCallbacks && roomCallbacks.length > 0;
                _.each(allRoomMessageHandlers, function (cb) {
                    if (cb) {
                        try {
                            cb(msg, hasWatched);
                        } catch (e) {
                            console.error('process room message error', e);
                        }
                    }
                });
            } else {
                console.log('unknown room message without roomId', msg);
            }
        });

        exports.setAppId = function (_appId) {
            appId = _appId;
        };
        var cachingRequests = {};
        var bindRequestHandler = function (requestId) {
            if (!requestId) {
                return null;
            }
            var cache = {};
            var promise = new Promise(function (resolve, reject) {
                cache.resolve = resolve;
                cache.reject = reject;
                setTimeout(function () {
                    var c = cachingRequests[requestId];
                    if (c) {
                        delete cachingRequests[requestId];
                        c.reject('timeout');
                    }
                }, 5000);
            });
            cache.promise = promise;
            cachingRequests[requestId] = cache;
            return promise;
        };
        var generateRequestId = function () {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < 30; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        };
        var signInPromise = null;
        var currentPeerId = null;
        exports.getAppKey = function () {
            return window.OB_APP_KEY;
        };
        /**
         * connect to realtime server
         * @param peerId
         */
        exports.signIn = function (peerId, update) {
            if (signInPromise && !update) {
                return signInPromise;
            }
            currentPeerId = peerId;
            signInPromise = new Promise(function (resolve, reject) {
                if (!window.OB_APP_KEY) {
                    console.log('need set OB_APP_KEY');
                    reject('need set OB_APP_KEY');
                    return;
                }
                exports.onOpen(function () {
                    var requestId = generateRequestId();
                    socket.emit('sign_in', requestId, peerId, exports.getAppKey());
                    bindRequestHandler(requestId)
                        .then(function () {
                            onlineFlag = true;
                            resolve.apply(null, arguments);
                        }, reject);
                });
            });
            return signInPromise;
        };


        exports.isConnected = function () {
            return onlineFlag;
        };
        exports.onReUse = function (callback) {
            onReUseCallbacks.push(callback);
        };
        exports.watchAllRoomMessage = function (callback, id) {
            if (!_.keys(allRoomMessageHandlers).contains(id)) {
                allRoomMessageHandlers[id] = callback;
            }
        };
        exports.removeAllRoomMessage = function (id) {
            delete allRoomMessageHandlers[id];
        };
        exports.createRoom = function (name, members, options) {
            members = members || [];
            options = options || {};
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                socket.emit('create_room', requestId, name, members);
                bindRequestHandler(requestId)
                    .then(function (room) {
                        resolve(_.extend({id: room._id}, room));
                    }, reject);
            });
        };
        exports.findRoom = function (id) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                socket.emit('room', requestId, id);
                bindRequestHandler(requestId)
                    .then(function (room) {
                        resolve(_.extend({id: room._id}, room));
                    }, reject);
            });
        };
        exports.joinRoom = function (room) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                var roomId = _.isString(room) ? room : room.id;
                socket.emit('join_room', requestId, roomId);
                bindRequestHandler(requestId)
                    .then(function (room) {
                        resolve(_.extend({id: room._id}, room));
                    }, reject);
            });
        };
        exports.findAndJoinRoom = function (id) {
            return new Promise(function (resolve, reject) {
                exports.findRoom(id)
                    .then(function (room) {
                        exports.joinRoom(room)
                            .then(function () {
                                resolve(room);
                            }, reject);
                    }, reject);
            });
        };
        exports.removeUserFromRoom = function (room, peerId) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                var roomId = _.isString(room) ? room : room.id;
                socket.emit('remove_member_from_room', requestId, roomId, peerId);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        /**
         * get total members count of room(include online and offline users)
         * @param room
         */
        exports.getRoomMembersCount = function (room) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                var roomId = _.isString(room) ? room : room.id;
                socket.emit('room_members_count', requestId, roomId);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        exports.addMemberToRoom = function (room, peerId) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                var roomId = _.isString(room) ? room : room.id;
                socket.emit('add_member_to_room', requestId, roomId, peerId);
                bindRequestHandler(requestId)
                    .then(function (room) {
                        resolve(_.extend({id: room._id}, room));
                    }, reject);
            });
        };

        exports.listRoomMembers = function (room) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                var roomId = _.isString(room) ? room : room.id;
                socket.emit('room_members', requestId, roomId);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        var watchingMessageRoomsCallbacks = {};
        var watchingMessageRoomsCallbackIds = {};
        exports.watchRoomMessages = function (room, callback, id) {
            var repeat = false;
            if (watchingMessageRoomsCallbacks[room.id]) {
                if (id) {
                    _.each(watchingMessageRoomsCallbackIds[room.id], function (v) {
                        if (v == id) {
                            repeat = true;
                        }
                    });
                    if (!repeat) {
                        watchingMessageRoomsCallbacks[room.id].push(callback);
                    }
                } else {
                    watchingMessageRoomsCallbacks[room.id].push(callback);
                }
            } else {
                watchingMessageRoomsCallbacks[room.id] = [callback];
                id && (watchingMessageRoomsCallbackIds[room.id] = [id]);
                //realTimeServerService.watchRoomMessages(room.id, room.id);
            }
            return exports;
        };
        exports.clearRoomMessageWatchers = function (room) {
            watchingMessageRoomsCallbacks[room.id] = undefined;
        };
        exports.watchRoomsJoin = function (callback) {
            //rt.on('join', function (data) {
            //    callback(data);
            //});
            // TODO
        };
        /**
         * 获取peers的在线状态
         * @param peerIdsOrPeerId
         */
        exports.getPeerStatus = function (peerIdsOrPeerId) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                var peers = _.isString(peerIdsOrPeerId) ? [peerIdsOrPeerId] : peerIdsOrPeerId;
                socket.emit('peers_status', requestId, peers);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        /**
         * 发送文本消息到room
         * @param room
         * @param msg
         * @returns {Promise}
         */
        exports.sendTextToRoom = function (room, msg) {
            return new Promise(function (resolve, reject) {
                //realTimeServerService.sendTextToRoom(room.id, msg).then(resolve, reject);
                var num=0;
                var roomId = _.isString(room) ? room : room.id;
                var requestId = generateRequestId();
                function whenError() {
                    if (SuperId.userInfo) {
                        num++;
                        if(num==10){//重连次数太多，中断刷新界面
                            window.location.reload()
                        }
                        exports.signIn(SuperId.userInfo.id,true)
                            .then(function () {
                                sendText();
                            }, function () {
                            });
                    }
                }
                function sendText(){
                    socket.emit('send_text_to_room', requestId, roomId, msg);
                    bindRequestHandler(requestId)
                        .then(function (msg) {
                            if (msg._id && !msg.id) {
                                msg.id = msg._id;
                            }
                            resolve(msg);
                        }, whenError);
                }
                sendText();

            });
        };
        /**
         * 获取room的历史消息
         * @param room
         * @param limit
         * @param maxTimestamp
         * @param exceptMessageId
         */
        exports.getHistoryOfRoom = function (room, limit, maxTimestamp, exceptMessageId) {
            return exports.getHistoryOfRoomWithFilter(room, limit, maxTimestamp, null);
        };
        /**
         * 标记当前peer在某个room中最后阅读聊天记录的时间(使用当前服务器时间)
         * @param room
         * @returns {Promise}
         */
        exports.markRoomLastReadTime = function (room) {
            return new Promise(function (resolve, reject) {
                //realTimeServerService.markRoomLastReadTime(room.id, currentPeerId)
                //    .then(resolve, reject);
                var requestId = generateRequestId();
                var roomId = _.isString(room) ? room : room.id;
                socket.emit('mark_room_last_read_time', requestId, roomId);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        /**
         * 获取当前peer在某个room中的未读消息数量
         * @param room
         * @param filters 消息过滤器,只考虑满足filters条件的消息
         * @returns {Promise}
         */
        exports.getUnreadMessagesCountOfRoom = function (room, filters) {
            return new Promise(function (resolve, reject) {
                //realTimeServerService.getUnreadMessagesCountOfRoom(room.id, currentPeerId, filters)
                //    .then(resolve, reject);
                var requestId = generateRequestId();
                var roomId = _.isString(room) ? room : room.id;
                socket.emit('unread_messages_count_of_room', requestId, roomId, filters);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        /**
         * 获取某个room的历史消息
         * @param room
         * @param limit
         * @param maxTimestamp
         * @param filters
         * @returns {Promise}
         */
        exports.getHistoryOfRoomWithFilter = function (room, limit, maxTimestamp, filters) {
            limit = limit || 50;
            maxTimestamp = maxTimestamp || -1;
            return new Promise(function (resolve, reject) {
                var num =0;
                var requestId = generateRequestId();
                var roomId = _.isString(room) ? room : room.id;
                function whenError() {
                    if (SuperId.userInfo) {
                        num++;
                        if(num==10){//重连次数太多，中断刷新界面
                            window.location.reload()
                        }
                        exports.signIn(SuperId.userInfo.id,true)
                            .then(function () {
                                getHistory();
                            }, function () {
                            });
                    }
                }
                var getHistory = function () {
                    socket.emit('room_history', requestId, roomId, limit, maxTimestamp, filters);
                    bindRequestHandler(requestId)
                        .then(function (history) {
                            _.each(history, function (item) {
                                item.id = item._id;
                            });
                            resolve({histories: history});
                        }, whenError);
                };
                getHistory();
            });
        };
        exports.getHistoryOfMessagesWithFilter = function (limit, maxTimestamp, filters) {
            limit = limit || 50;
            maxTimestamp = maxTimestamp || -1;
            return new Promise(function (resolve, reject) {
                var num =0;
                var requestId = generateRequestId();
                function whenError() {
                    if (SuperId.userInfo) {
                        num++;
                        if(num==10){//重连次数太多，中断刷新界面
                            window.location.reload()
                        }
                        exports.signIn(SuperId.userInfo.id,true)
                            .then(function () {
                                getHistory();
                            }, function () {
                            });
                    }
                }
                var getHistory = function () {
                    socket.emit('message_history_with_filters', requestId, limit, maxTimestamp, filters);
                    bindRequestHandler(requestId)
                        .then(function (history) {
                            _.each(history, function (item) {
                                item.id = item._id;
                            });
                            resolve({histories: history});
                        }, whenError);
                };
                getHistory();
            });
        };
        /**
         * 离开room
         * @param room
         * @returns {Promise}
         */
        exports.leaveRoom = function (room) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                var roomId = _.isString(room) ? room : room.id;
                socket.emit('leave_room', requestId, roomId);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        /**
         * 获取在线连接数
         * @returns {Promise}
         */
        exports.getOnlineChannelsCount = function () {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                socket.emit('online_channels_count', requestId);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        /**
         * 获取在线peers数
         * @returns {Promise}
         */
        exports.getOnlinePeersCount = function () {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                socket.emit('online_peers_count', requestId);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        exports.getOnlinePeers = function() {
            return new Promise(function(resolve, reject) {
                var requestId = generateRequestId();
                socket.emit('online_peers', requestId, appId);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        /**
         * 获取当前peer的最近limit条,满足filters条件,并且orProperties这些属性中任何一个等于filterValue(如果orProperties和filterValue都不为空),或者处于includeRoomIds中的消息
         * 按消息时间倒序排序
         * 这个接口适用于获取用户最近的单对单聊天或者群组聊天的最后消息等情况
         */
        exports.getPeerHistory = function (filters, orProperties, filterValue, limit, includeRoomIds) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                socket.emit('peer_history', requestId, filters, orProperties, filterValue, limit, includeRoomIds);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        /**
         * 获取peerId在满足filters条件的消息列表,参数意义按getPeerHistory接口
         * @param filters
         * @param orProperties
         * @param filterValue
         * @param limit
         * @param includeRoomIds
         * @returns {Promise}
         */
        exports.getPeerHistoryWithUnreadTop = function (filters, orProperties, filterValue, limit, includeRoomIds) {
            return new Promise(function (resolve, reject) {
                var requestId = generateRequestId();
                socket.emit('peer_history_with_unread_top', requestId, filters, orProperties, filterValue, limit, includeRoomIds);
                bindRequestHandler(requestId)
                    .then(resolve, reject);
            });
        };
        /**
         * 关闭连接
         * @returns {Promise}
         */
        exports.close = function () {
            return new Promise(function (resolve, reject) {
                socket.close();
                resolve();
            });
        };
    }
})();
