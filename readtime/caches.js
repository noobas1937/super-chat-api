var redis = require('redis'),
    consts = require('./consts'),
    Q = require('bluebird'),
    affairRealationKey = 'affair';

Q.promisifyAll(redis.RedisClient.prototype);
Q.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(consts.redis_uri);




//关键值叫做 affair

exports.setPeerAffairRelationCache = function (userId1, userId2) {
    var value = getCacheContent(userId1, userId2);
    return redisClient.sadd(affairRealationKey, value);
};

function getCacheContent(userId1, userId2){
    return userId1 >= userId2 ? (userId1 + '@' + userId2) : (userId2 + '@' + userId1);
};

exports.ifPeerAffairRelation = function (userId1, userId2) {
    var value = getCacheContent(userId1, userId2);

    redisClient.sismemberAsync(affairRealationKey, value).
        then(function(res){
            if(res == 1){//如果在缓存中确认两人在同一个affair中
                return new Promise(function(resolve, reject){
                    resolve(true);
                });
            }else{
                //TODO 调用java后台查询两人是否在同一affair中
                //TODO 如果在的话则将两者的关系加入到cache中
                if(true){
                    exports.setPeerAffairRelationCache(userId1, userId2);
                    return new Promise(function(resolve, reject){
                        resolve(true);
                    });
                }else{
                    return new Promise(function(resolve, reject){
                        resolve(false);
                    });
                }
            }
    });

};

