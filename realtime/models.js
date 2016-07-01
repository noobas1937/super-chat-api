var mongoose = require('mongoose')
    , consts = require('./consts')
    // , node_utils = require('../util/node_utils')
    , caches = require('./caches')
    , redis = require('redis');

mongoose.connect(consts.mongo_uri); //连接mongodb数据库


var Schema = mongoose.Schema;


//TODO 针对后期的查询做索引优化(目前Index的使用比较粗略)以及原系统的filter的使用策略暂时还不够明确
var MessageSchema = new Schema({
    type : {type: String, index: true},  //用于存储消息的类型提高信息检索的效率
    key : {type: String, index: true},   //用于查询历史信息的key如果是群聊天key为GroupId 如果两人聊天则为RoleId_1@RoleId_2的形式
    timestamp: Number,  //时间戳用于和时间有关的查询
    fromId : {type: String, index: true},
    affairId : {type: String, index: true},
    fromRole : {type: String, index: true},
    toRole : {type: String, index: true},
    toUserId: String,
    groupId : String,  
    content: String   //存放message
});


var LastReadTimeSchema = new Schema({
    userId : String,
    toUserId : String,
    affairId : String,
    groupId : String
});

var Message = mongoose.model('Message', MessageSchema, 'Messages');

var LastReadTime = mongoose.model('LastReadTime', LastReadTimeSchema, 'LastReadTimes');



exports.Message = Message;
exports.LastReadTime = LastReadTime;

