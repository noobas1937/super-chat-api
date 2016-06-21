var mongoose = require('mongoose')
    , consts = require('./consts')
    , node_utils = require('../util/node_utils')
    , caches = require('./caches')
    , redis = require('redis');

mongoose.connect(consts.mongo_uri); //连接mongodb数据库


var Schema = mongoose.Schema;


//TODO 针对后期的查询做索引优化(目前Index的使用比较粗略)以及原系统的filter的使用策略暂时还不够明确
var MessageSchema = new Schema({
    key : {type: String, index: true},   //用于查询历史信息的key如果是群聊天key为GroupId 如果两人聊天则为RoleId_1@RoleId_2的形式
    type : {type: String, index: true},  //用于存储消息的类型提高信息检索的效率
    fromId : {type: String, index: true},
    type : {type: String, index: true},
    affairId : {type: String, index: true},
    fromRole : {type: String, index: true},
    toRole : {type: String, index: true},
    displayName : String,
    toUserId: String,
    groupId : String,  //如果讨论组聊天的话那么就启用groupId
    id: {type: String, index: true},
    content: String,
    timestamp: Number,
    filter1: {type: String, index: true},
    filter2: {type: String, index: true},
    filter3: {type: String, index: true}
});

var Message = mongoose.model('Message', MessageSchema, 'Messages');



exports.Message = Message;

