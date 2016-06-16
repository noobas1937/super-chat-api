var redis = require('redis'),
    consts = require('./consts'),
    Q = require('bluebird'),
    affairRealationKey = 'affair';

Q.promisifyAll(redis.RedisClient.prototype);
Q.promisifyAll(redis.Multi.prototype);
var redisClient = redis.createClient(consts.redis_uri);

redisClient.sadd(affairRealationKey, "1");
redisClient.sadd(affairRealationKey, "2");
redisClient.saddAsync(affairRealationKey, "3").then(function(res){
    console.log(res);
});

redisClient.scard(affairRealationKey,showData);



function showData(err, data){
    console.log(data);
}