var models = require('./models'),
    Message = models.Message,
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
        //TODO 处理查询项
        Message.find(query).sort([['timestamp', 'descending']]).limit(limit).maxTime(1000).exec(function (err, records) {
            if(err){
                reject(err);
            }else{
                resolve(records);
            }
        });
    });
}