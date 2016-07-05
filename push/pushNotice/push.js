/**
 * Created by zangxiaojie on 16/6/30.
 */
var ALY = require('../aliyun-sdk-js/index.js');
var push = new ALY.PUSH({
        accessKeyId: 'I3L5ZpfjJM4Oamo5',
        secretAccessKey: 'dexEw9DMZVymWF7WjiTdNFbtBU3Qg8',
        endpoint: 'http://cloudpush.aliyuncs.com',
        apiVersion: '2015-08-27'
    }
);


var pushNoticeToAndroid = function (message) {
    push.pushNoticeToAndroid({
        AppKey: '23396884',
        Target: 'account', // 推送目标: device：推送给指定设备； account：推送给指定帐号；all：推送给全部
        TargetValue: message.userId,
        Title: 'title',
        Summary: message.content,
        AndroidExtParameters: '{\"id\":1002,\"content\":\"Hello OpenAPI!\"}'
    }, function (err, res) {
        console.log(err, res);
    });
};


var pushNoticeToiOS = function (message) {
    push.pushNoticeToiOS({
        AppKey: '23396884',
        Target: 'all', // 推送目标: device：推送给指定设备； account：推送给指定帐号；all：推送给全部
        TargetValue: 'all',
        Title: 'title',
        Summary: message.content,
        AndroidExtParameters: '{\"id\":1002,\"content\":\"Hello OpenAPI!\"}'
    }, function (err, res) {
        console.log(err, res);
    });


};


exports.pushNotice=function(message){
    var toAndroid=true;
    //用以判断Android or iOS
    if (toAndroid){
        pushNoticeToAndroid(message);
    }else{
        pushNoticeToiOS(message);
    }
};