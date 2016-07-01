var channelService = require('../realtime/channel');



var message = {
    'type': 'chat',
    'fromId': '0f2f6985-1c62-43bd-8301-45fc8bf38ce4',
    'fromRole': 'aa8af1fa-bdde-4ecb-a87b-6bcfa91b5ce3',
    'toUserId': '9ed3838e-6242-4df9-b5b9-b64b47f37e85',
    'toRole': 'ea0ee39c-3ebf-45f2-8c34-7a594def2150',
    'affairId': '71d97697-b455-4ea3-b112-45d35d7b96ea',
    'content': '哈哈哈哈哈 你 是 傻 了 吧 '
};


channelService.sendMessageToPeer(message, '9ed3838e-6242-4df9-b5b9-b64b47f37e85').then(function (res) {
    console.log('发送消息成功');
}, function (error) {
    console.log(error);
});