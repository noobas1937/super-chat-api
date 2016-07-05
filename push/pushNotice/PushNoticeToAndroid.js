var ALY = require('../aliyun-sdk-js/index.js');
var push = new ALY.PUSH({
        accessKeyId: 'I3L5ZpfjJM4Oamo5',
        secretAccessKey: 'dexEw9DMZVymWF7WjiTdNFbtBU3Qg8',
        endpoint: 'http://cloudpush.aliyuncs.com',
        apiVersion: '2015-08-27'
    }
);
push.pushNoticeToAndroid({
    AppKey: '23396884',
    Target: 'device', // 推送目标: device：推送给指定设备； account：推送给指定帐号；all：推送给全部
    TargetValue: 'e1d2c8c107d24418b88f1708ea0e918b',
    Title: 'title',
    Summary: 'fuck all of you in the black room',
    AndroidExtParameters: '{\"id\":1002,\"content\":\"Hello OpenAPI!\"}'
}, function (err, res) {
    console.log(err, res);
});

return ;
