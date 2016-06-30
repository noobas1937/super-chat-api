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


//TODO 事务关系以及好友关系的缓存结构可能可以进一步优化

/**
 * 向缓存中添加用户之间的affair关系
 * @param roleId_1
 * @param roleId_2
 * @returns {*}
 */
exports.setPeerAffairRelationCache = function (roleId_1, roleId_2, affairId) {
    var value = getCacheContentUtil(roleId_1, roleId_2);
    value += ('@' + affairId);
    return redisClient.saddAsync(affairRelationKey, value); //向缓存中添加新的关系项
};

/**
 * 判断需要会话的两个用户是否在同一个事务中
 * @param roleId_1
 * @param roleId_2
 */
exports.ifPeerAffairRelation = function (roleId_1, roleId_2, affairId) {

    var value = getCacheContentUtil(roleId_1, roleId_2);
    value += ('@' + affairId);

   
    return new Promise(function (resolve, reject) {
        redisClient.sismember(affairRelationKey, value, function (error, res) {
            if(error){
                reject(error);
            }else{
                if(res ==1){
                    resolve(true);
                }else{   //如果在缓存中没有查到该关系项则去Mysql数据库中查询
                    mysqlService.ifInSameAffair(roleId_1, roleId_2, affairId)
                        .then(function (res) {
                            if(res){     //如果在Mysql数据库中查询到在同一个事务中则添加到缓存中
                                exports.setPeerAffairRelationCache(roleId_1, roleId_2, affairId);
                                resolve(true);
                            }else{
                                resolve(false);
                            }
                        }, function (error) {
                            reject(error);
                        });
                }
            }
        });
    });
};

/**
 * 向缓存中添加好友关系项
 * @param roleId_1
 * @param roleId_2
 * @returns {*}
 */
exports.setPeerFriendRelationCache = function (roleId_1, roleId_2) {
    var value = getCacheContentUtil(roleId_1, roleId_2);
    return redisClient.saddAsync(friendRelationKey, value);
}

/**
 * 判断两个要进行会话的用户是否为好友关系
 * @param roleId_1
 * @param roleId_2
 */
exports.ifPeerFriendRelation = function (roleId_1, roleId_2) {
    var value = getCacheContentUtil(roleId_1, roleId_2);

    return new Promise(function (resolve, reject) {
        redisClient.sismember(friendRelationKey, value, function (error, res) {
            if(error){
                reject(error);
            }else{
                if(res == 1){
                    resolve(true);
                }else{  //如果缓存中找不到则到Mysql中查询
                    mysqlService.ifFriendRelation(roleId_1, roleId_2)
                        .then(function (res) {
                            if(res){   //如果在数据库中查询在为朋友关系则添加到缓存中
                                exports.setPeerFriendRelationCache(roleId_1, roleId_2);
                                resolve(true);
                            }else{
                                resolve(false);
                            }
                        }, function (error) {
                            reject(error);
                        });
                }
            }
        });
    });
};

/**
 * 添加讨论组人员信息的缓存
 * @param groupId
 * @param roleIds
 */
exports.setGroupMemberRoleIds = function (groupId, roleIds) {
    var key = groupKey + '_' +groupId;
    _.each(roleIds,function (val) {
        redisClient.sadd(key, val);
    });

};

/**
 * 获得讨论组的成员信息
 * @param groupId
 * @returns {Promise}
 */
exports.getGroupMemberList = function (groupId) {
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
                                exports.setGroupMemberRoleIds(groupId, result);
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


/**
 * 判断一个用户是否在某一个Group中
 * @param peerId
 * @param groupId
 */
exports.ifPeerInGroup = function (roleId, groupId) {
    return new Promise(function (resolve, reject) {
        exports.getGroupMemberList(groupId)
            .then(function (data) {
                _.each(data, function (item) {  //TODO 不确定执行完resolve后for循环是否会终止为了保险加上了return语句,后续需了解相关知识
                    if(item == roleId){
                        resolve(true);
                        return;
                    }
                });
                resolve(false);
            }, function (error) {
                reject(error);
            });
    });
};

/**
 * 比较roleId的简单工具方法
 * @param roleId_1
 * @param roleId_2
 * @returns {string}
 */
function getCacheContentUtil(roleId_1, roleId_2){
    return roleId_1 <= roleId_2 ? (roleId_1 + '-' + roleId_2) : (roleId_2 + '-' + roleId_1);   //TODO 确认这样比较字符串是否会有问题
};





