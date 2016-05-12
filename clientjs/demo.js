(function () {
    var host = 'ws://localhost:8065/websocket';
    var rpc = new jzrpc.Connection();
    var demoServerService = rpc.addRemoteService('demo', ['sayHi', 'sayHiFuture', 'sayHiTask', 'subscribeMessage']);
    var realTimeServerService = rpc.addRemoteService('realtime',
        ['setPeerId', 'getCurrentPeerId', 'watchPeers', 'unWatchPeers', 'sendMessage', 'createAndJoinGroup', 'getInfoOfGroup',
            'joinGroup', 'inviteOthersToGroup', 'kickOthersFromGroup']);
    var appManageServerService = rpc.addRemoteService('app_manager', ['createApp', 'updateAppAuthCode', 'listApps']);
    var serverCoreService = rpc.getCoreService();
    var clientService = {
        getHi: function (name) {
            return "Hello from client, and you are " + name;
        }
    };
    var demoService = {
        getAge: function () {
            return 23;
        },
        printServerNumber: function (num) {
            console.log("got server number ", num);
            return num;
        },
        callByPassCall: function () {
            console.log('got pass call', arguments);
        }
    };
    var notificationService = {
        onMessage: function(from, message) {
            console.log('got server message, from ' + from +': ' + message);
        }
    };
    rpc.addLocalService('clientService', clientService);
    rpc.addLocalService('notification', notificationService);
    rpc.addLocalService('demo', demoService);
    rpc.onopen(function () {
        var future = demoServerService.sayHi('zoowii'); // or you can use sayHi method
        future.then(function (result, err, errMsg) {
            if (!err) {
                console.log('got rpc result from server: ', result);
            }
        });
        rpc.trampoline(function () {
            return serverCoreService.addTag('testtag');
        }, function (addResult) {
            return serverCoreService.getTags();
        }, function (tags) {
            console.log('current tags', tags);
        });
        demoServerService.subscribeMessage('test-channel');
        serverCoreService.getChannelId().then(function (channelId) {
            console.log('channel id is ', channelId);
        });
    });
    rpc.connect(host);
})();