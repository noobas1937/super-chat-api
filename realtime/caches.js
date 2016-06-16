var redis = require('redis'),
    consts = require('./consts'),
    Q = require('bluebird'),
    affairRelationKey = 'affair',
    friendRelationKey = 'friend';

//实现RedisClient方法Promise化
Q.promisifyAll(redis.RedisClient.prototype);
Q.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(consts.redis_uri);

/**
 * 向缓存中添加用户之间的affair关系
 * @param userId1
 * @param userId2
 * @returns {*}
 */
exports.setPeerAffairRelationCache = function (userId1, userId2, affairId) {
    var value = getCacheContent(userId1, userId2, affairId);
    return redisClient.sadd(affairRelationKey, affairId+value);
};

//TODO 确认这样比较字符串是否会有问题
function getCacheContent(userId1, userId2){
    return userId1 >= userId2 ? (userId1 + '@' + userId2) : (userId2 + '@' + userId1);
};

/**
 * 判断需要会话的两个用户是否在同一个事务中
 * @param userId1
 * @param userId2
 */
exports.ifPeerAffairRelation = function (userId1, userId2, affairId) {
    var value = affairId + getCacheContent(userId1, userId2);

    redisClient.sismemberAsync(affairRelationKey, value).
        then(function(res){
            if(res == 1){//如果在缓存中确认两人在同一个affair中
                return new Promise(function(resolve, reject){
                    resolve(true);
                });
            }else{
                //TODO 调用java后台查询两人是否在同一affair中
                //TODO 如果在的话则将两者的事务关系加入到cache中
                if(true){
                    exports.setPeerAffairRelationCache(userId1, userId2, affairId);
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

/**
 * 向缓存中添加好友关系项
 * @param userId1
 * @param userId2
 * @returns {*}
 */
exports.setPeerFriendRelationCache = function (userId1, userId2) {
    var value = getCacheContent(userId1, userId2);
    return redisClient.saddAsync(friendRelationKey, value);
}

/**
 * 判断两个要进行会话的用户是否为好友关系
 * @param userId1
 * @param userId2
 */
exports.ifPeerFriendRelation = function (userId1, userId2) {
    var value = getCacheContent(userId1, userId2);

    redisClient.sismemberAsync(value)
        .then(function (res) {
            if(res == 1){//如果在缓存中确认两人在同一个affair中
                return new Promise(function(resolve, reject){
                    resolve(true);
                });
            }else{
                //TODO 调用java后台查询两人是否为朋友关系
                //TODO 如果在的话则将两者的好友关系加入到cache中
                if(true){
                    exports.setPeerFriendRelationCache(userId1, userId2);
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
}



