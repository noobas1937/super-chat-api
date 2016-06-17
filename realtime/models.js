var mongoose = require('mongoose')
    , consts = require('./consts')
    , node_utils = require('../util/node_utils')
    , caches = require('./caches')
    , redis = require('redis');

mongoose.connect(consts.mongo_uri); //连接mongodb数据库


var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    fromId : {type: String, index: true},
    type : {type: String, index: true},
    affairId : {type: String, index: true},
    fromRole : {type: String, index: true},
    toRole : {type: String, index: true},
    displayName : String,
    toUserId: {type: String, index: true},
    id: {type: String, index: true},
    content: String
});

var Message = mongoose.model('Message', MessageSchema, 'Messages');

exports.Message = Message;

