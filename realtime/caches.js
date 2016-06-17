var redis = require('redis'),
    consts = require('./consts'),
    mysqlService = require('./mysql-service'),
    _ = require('underscore'),
    Q = require('bluebird'),
    affairRelationKey = 'affair',
    friendRelationKey = 'friend',
    groupKey = 'group';

//实现RedisClient方法Promise化
Q.promisifyAll(redis.RedisClient.prototype);
Q.promisifyAll(redis.Multi.prototype);

var redisClient = redis.createClient(consts.redis_uri);

/**
 * 向缓存中添加用户之间的affair关系
 * @param roleId_1
 * @param roleId_2
 * @returns {*}
 */
exports.setPeerAffairRelationCache = function (roleId_1, roleId_2, affairId) {
    var value = getCacheContent(roleId_1, roleId_2, affairId);
    return redisClient.sadd(affairRelationKey, affairId+value);
};

//TODO 确认这样比较字符串是否会有问题
function getCacheContent(roleId_1, roleId_2){
    return roleId_1 >= roleId_2 ? (roleId_1 + '@' + roleId_2) : (roleId_2 + '@' + roleId_1);
};

/**
 * 判断需要会话的两个用户是否在同一个事务中
 * @param roleId_1
 * @param roleId_2
 */
exports.ifPeerAffairRelation = function (roleId_1, roleId_2, affairId) {
    var value = affairId + getCacheContent(roleId_1, roleId_2);

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
                    exports.setPeerAffairRelationCache(roleId_1, roleId_2, affairId);
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
 * @param roleId_1
 * @param roleId_2
 * @returns {*}
 */
exports.setPeerFriendRelationCache = function (roleId_1, roleId_2) {
    var value = getCacheContent(roleId_1, roleId_2);
    return redisClient.saddAsync(friendRelationKey, value);
}

/**
 * 判断两个要进行会话的用户是否为好友关系
 * @param roleId_1
 * @param roleId_2
 */
exports.ifPeerFriendRelation = function (roleId_1, roleId_2) {
    var value = getCacheContent(roleId_1, roleId_2);

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
                    exports.setPeerFriendRelationCache(roleId_1, roleId_2);
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

exports.setGroupMemberRoleIds = function (groupId, roleIds) {
    var key = groupKey + '_' +groupId;
    _.each(roleIds,function (val) {
        redisClient.sadd(key, val);
    });

};

exports.getGroupMemberRoleIds = function (groupId) {
    var key = groupKey + '_' +groupId;
    return new Promise(function (resolve, reject) {
        redisClient.smembers(key, function(err, data){
            if(err){
                reject(err);
            }else{
                if(data.length == 0){  //如果redis缓存中不存在该讨论组成员信息,则从Mysql数据库中进行获取
                    mysqlService.getGroupMembers(groupId)
                        .then(function (result) {
                            if(result.length == 0){ //如果Mysql数据库中还是获取不到该Group的成员信息
                                reject(new Error('Group not found'));
                            }else{
                                exports.setGroupMemberRoleIds(groupId, result); //TODO 传过来的格式数据格式还需要匹配一下
                                resolve(result);
                            }
                        }, function (err) {
                            reject(err);
                        });

                }else{
                    resolve(data);
                }
            }
        });
    });
};






