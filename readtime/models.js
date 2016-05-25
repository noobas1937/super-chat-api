var mongoose = require('mongoose')
    , consts = require('./consts')
    , node_utils = require('../util/node_utils')
    , caches = require('./caches')
    , redis = require('redis');

mongoose.connect(consts.mongo_uri); //连接mongodb数据库

//设置redis服务器地址和错误事件
var pubRedisClient = redis.createClient(consts.redis_uri);
var subRedisClient = redis.createClient(consts.redis_uri);
pubRedisClient.on("error", function (err) {
    console.log("Error " + err);
});
subRedisClient.on("error", function (err) {
    console.log("Error " + err);
});

var Schema = mongoose.Schema;



