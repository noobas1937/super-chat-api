var mysql = require('mysql'),
    mysqlCfg = require('./mysqlCfg.json'),
    _ = require('underscore');

var db = mysql.createConnection(mysqlCfg);

db.on('error', function (error) {
    console.error(error);
});


/**
 * 得到一个讨论组的所有成员
 * @param groupId
 */
exports.getGroupMembers = function(groupId){
    return new Promise(function (resolve, reject) {
        db.query('SELECT user_id FROM discuss_group_member WHERE group_id = ?',  //此处选择user_id而非role_id作为key否则一个user可能有多个role导致重复收到消息
            [groupId],
            function (err, info) {
                if(err){
                        reject(err);
                }else{
                        var data = [];
                        _.each(info, function (item) {
                            data.push(item.user_id);
                        });
                        resolve(data);
                }
            });
    });

};


/**
 * 判断两个用户是否在同一个事务中
 * @param roleId_1
 * @param roleId_2
 * @param affairId
 * @returns {Promise}
 */
exports.ifInSameAffair = function(roleId_1, roleId_2, affairId){

    return new Promise(function (resolve, reject) {
        //TODO AND后面部分可以用'IN'语句来实现但是传递参数的时候遇到问题待解决
        db.query('SELECT id FROM affair_member WHERE affair_id = ? AND (role_id = ? OR role_id = ?)',
            [affairId, roleId_1, roleId_2],
            function(err, info){
                if(err){
                    reject(err);
                }else{
                    if(info.length == 2){ //如果 info.length == 2 说明两个用户都在当前事务里
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                }
            });
    });
};


/**
 * 判断两个用户是否为好友关系
 * @param roleId_1
 * @param roleId_2
 */
exports.ifFriendRelation = function(roleId_1, roleId_2){
    return new Promise(function (resolve, reject) {
        //因friend关系表中roleId1和roleId2是没有按照大小顺序存故使用OR
        db.query('SELECT id FROM friend WHERE (role_id_1 = ? AND role_id_2 = ? AND state = 0) OR (role_id_2 = ? AND role_id_1 = ? AND state = 0)',
            [roleId_1, roleId_2, roleId_1, roleId_2],
            function(err, info){
                if(err){
                    reject(err);
                }else{
                    if(info.length == 0){
                        resolve(false);
                    }else{
                        resolve(true);
                    }
                }
            });
    });
};


