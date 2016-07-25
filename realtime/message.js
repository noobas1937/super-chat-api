var models = require('./models'),
    Message = models.Message,
    LastReadTime = models.LastReadTime,
    _ = require('underscore');

/**
 * 查询信息
 * @param beginTime
 * @param endTime
 * @param filters
 * @returns {Promise}
 */
exports.findMessage = function (beginTime, endTime, limit, filters) {
    return new Promise(function (resolve, reject) {
        limit = limit || 20;
        if(limit > 100){
            limit = 100;
        }
        var query = {};
        query.timestamp = {'$gte': beginTime, '$lte': endTime};  //TODO 防御式编程以及确定timestamp的格式

        if(_.isObject(filters)){
            var keys = _.keys(filters);
            _.each(keys, function (key) {
                query[key] = filters[key];
            });
        }

        Message.find(query).sort([['timestamp', 'descending']]).limit(limit).maxTime(1000).exec(function (err, records) {
            if(err){
                reject(err);
            }else{
                resolve(records);
            }
        });
    });
};

/**
 * 设置readTime
 * @param userId
 * @param filters
 */
exports.markReadTime = function (userId, filters) {
    return new Promise(function (resolve, reject) {
        var data = {'userId': userId};
        if(_.isObject(filters)){
            var keys = _.keys(filters);
            _.each(keys, function (key) {
                data[key] = filters[key];
            });
        }
        var lastReadTime = new LastReadTime(data);
        lastReadTime['timestamp'] = Date.now();
        LastReadTime.find(filters, function(error, res){
            if(error){
                reject(error);
            }else{
                if(res.length == 0){//如果尚未有对应的记录
                    lastReadTime.save();
                }else if(res.length == 1){//如果已经有了对应的记录
                    var _id = res[0]._id;
                    LastReadTime.update({'_id': _id}, {'timestamp' : Date.now()}, function (error, res) {
                        if(error){
                            reject(error);
                        }else{
                            resolve(res);
                        }
                    });
                }else {
                    reject(new Error('一个用户对应多个read_time'));
                }
            }
        });
    });
};

/**
 * 获得一个会话的未读消息数量
 * @param userId
 * @param filters
 * @returns {Promise}
 */
exports.getUnreadMessageCount = function (userId, filters) {
    return new Promise(function (resolve, reject) {
        var timeFilters = new Object(filters);
        timeFilters.userId = userId;
        exports.getLastReadTime(timeFilters).then(function (res) {
            var lastReadTime = res;
            filters.timestamp = {'$gte': lastReadTime, '$lte': Date.now()};
            console.log('-----------开始查询未读消息数量--------');
            Message.count(filters, function (error, res) {
                if(error){
                    console.log('-----------查询未读消息时发生错误--------');
                    reject(error);
                }else{
                    if(res == 0) {
                        resolve({'count': res, 'lastReadTime': lastReadTime, 'latestUnreadMessage': {}});
                    }else{
                        Message.find(filters).limit(0).exec(function (error, msg) {
                            if(error){
                                reject(error);
                            }else{
                                resolve({'count': res, 'lastReadTime': lastReadTime, 'latestUnreadMessage': msg[0]});
                            }
                        });
                    }
                }
            });
        }, function (error) {
            reject(error);
        });
    });
};

/**
 * 获得一个会话的lastReadTime
 * @param filters
 * @returns {Promise}
 */
exports.getLastReadTime = function (filters) {
    return new Promise(function (resolve, reject) {
        LastReadTime.find(filters, function (error, res) {
            if(error){
                console.log('------------getLastReadTime出错------------');
                reject(error);
            }else{
                console.log('------------getLastReadTime成功------------');
                if(res.length == 0){//如果两人还没聊过天 返回当前时间
                    resolve(Date.now());
                }
                else if(res.length == 1){
                    resolve(res[0].timestamp);
                }else {
                    reject(new Error('一个用户对应多个read_time.'));
                }
            }
        });
    });
};


