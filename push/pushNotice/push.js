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

exports.pushNoticeToAndroid = function (summary) {
    push.pushNoticeToAndroid({
        AppKey: '23396884',
        Target: 'all', // 推送目标: device：推送给指定设备； account：推送给指定帐号；all：推送给全部
        TargetValue: 'all',
        Title: 'title',
        Summary: summary,
        AndroidExtParameters: '{\"id\":1002,\"content\":\"Hello OpenAPI!\"}'
    }, function (err, res) {
        console.log(err, res);
    });
};

exports.pushNoticeToiOS = function (summary) {
    push.pushNoticeToiOS({
        AppKey: '23396884',
        Target: 'all', // 推送目标: device：推送给指定设备； account：推送给指定帐号；all：推送给全部
        TargetValue: 'all',
        Title: 'title',
        Summary: summary,
        AndroidExtParameters: '{\"id\":1002,\"content\":\"Hello OpenAPI!\"}'
    }, function (err, res) {
        console.log(err, res);
    });


};
