(function() {
    var appId = 'p1kdylvga8zjdeekjtzr3i10nib6gu3xxawklm8hpkec1lah';
    window.OB_APP_KEY = 'demo';

    var roomId = "5690c6d45de3b037175659da";

    var clientId = 'zoowii';
    var currentRoom;
    var rt;

    var openBtn = document.getElementById('open-btn');
    var sendBtn = document.getElementById('send-btn');
    var inputName = document.getElementById('input-name');
    var inputSend = document.getElementById('input-send');
    var printWall = document.getElementById('print-wall');
    var createRoomBtn = document.getElementById('create-room-btn');
    var showOnlineUsersBtn = document.getElementById('show-online-users');
    var inputRoomId = document.getElementById('room-id-input');
    
    inputRoomId.value = roomId;

    bindEvent(openBtn, 'click', main);
    bindEvent(sendBtn, 'click', sendMsg);

    bindEvent(document.body, 'keydown', function(e) {
        if (e.keyCode === 13) {
            if (!jzrealtime.isConnected()) {
                main();
            } else {
                sendMsg();
            }
        }
    });

    var main = _.throttle(function () {
        showLog('Connecting to server, waiting...');
        var val = inputName.value;
        if (val) {
            clientId = val;
        }
        if(!inputRoomId.value) {
            showLog('Please set room id');
            return;
        }
        roomId = inputRoomId.value;
        jzrealtime.signIn(clientId)
            .then(function(_rt) {
                rt = _rt;
                showLog('server connected successfully!');
                //rt.onReUse(function() {
                //    showLog('server reconnecting, please waiting');
                //});
                return jzrealtime.findRoom(roomId);
            }, function (err) {
                console.log('err', err);
            }).then(function(room) {
                currentRoom = room;
                console.log('room', room);
                jzrealtime.joinRoom(room)
                    .then(function() {
                        return jzrealtime.listRoomMembers(room);
                    }).then(function(members) {
                        console.log('room members', members);
                        showLog('current Conversation\'s member list:', members);
                    });
                jzrealtime.watchRoomMessages(room, function(data) {
                    // console.log(data);
                    var text = data;
                    if (data.msg && data.msg.type) {
                        text = data.msg.text;
                    } else if(data.msg) {
                        text = data.msg;
                    } else if(data.message) {
                        text = data.message;
                    }
                    var from = data.fromPeerId;
                    showLog(from + ': ', text);
                });
                jzrealtime.getHistoryOfRoomWithFilter(room, 100, -1, {fromUserId: 'hello'})
                    .then(function(data) {
                        data = data.histories;
                        console.log('history', data);
                        _.each(data, function (msg) {
                            showLog('', msg);
                        });
                    });
            }, function() {
                jzrealtime.createRoom('test-room', [clientId])
                    .then(function (newRoomId) {
                        if(!_.isString(newRoomId)) {
                            newRoomId = newRoomId.id;
                        }
                        console.log('created room ' + newRoomId);
                        currentRoom = {id: newRoomId};
                        roomId = newRoomId;
                        main();
                    });
            });
    }, 2000);

    function sendMsg() {
        if (!jzrealtime.isConnected()) {
            alert('please connect to server first');
            return;
        }
        var val = JSON.stringify({text: inputSend.value, fromUserId: 'hello'});

        jzrealtime.sendTextToRoom(currentRoom, val)
            .then(function(data) {
                inputSend.value = '';
                showLog('Yourself ' , val);
                printWall.scrollTop = printWall.scrollHeight;
            });
    }

    bindEvent(showOnlineUsersBtn, 'click', function() {
        jzrealtime.getOnlinePeers()
            .then(function(data) {
                console.log(data);
                showLog('Online Users ' , data);
                printWall.scrollTop = printWall.scrollHeight;
            });
    });
    
    bindEvent(createRoomBtn, 'click', function() {
        var val = inputName.value;
        if (val) {
            clientId = val;
        }
        jzrealtime.signIn(clientId)
            .then(function(_rt) {
                rt = _rt;
                showLog('server connected successfully!');
                //rt.onReUse(function() {
                //    showLog('server reconnecting, please waiting');
                //});
                jzrealtime.createRoom('test-room', [clientId])
                    .then(function (newRoomId) {
                        if(!_.isString(newRoomId)) {
                            newRoomId = newRoomId.id;
                        }
                        console.log('created room ' + newRoomId);
                        currentRoom = {id: newRoomId};
                        roomId = newRoomId;
                        inputRoomId.value = roomId;
                    });
            }, function (err) {
                console.log('err', err);
            });
    });

    function showLog(msg, data) {
        if (data) {
            // console.log(msg, data);
            msg = msg + '<span class="strong">' + encodeHTML(JSON.stringify(data)) + '</span>';
        } else {
            // console.log(msg);
        }
        var p = document.createElement('p');
        p.innerHTML = msg;
        printWall.appendChild(p);
    }

    function encodeHTML(source) {
        return String(source)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;');
        // .replace(/\\/g,'&#92;')
        // .replace(/"/g,'&quot;')
        // .replace(/'/g,'&#39;');
    }

    function bindEvent(dom, eventName, fun) {
        if (window.addEventListener) {
            dom.addEventListener(eventName, fun);
        } else {
            dom.attachEvent('on' + eventName, fun);
        }
    }

})();