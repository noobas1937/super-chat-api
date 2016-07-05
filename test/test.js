var redis = require('redis'),
    consts = require('./../realtime/consts'),
    Q = require('bluebird'),
    affairRealationKey = 'affair';

Q.promisifyAll(redis.RedisClient.prototype);
Q.promisifyAll(redis.Multi.prototype);
var redisClient = redis.createClient(consts.redis_uri);

redisClient.sadd(affairRealationKey, "dsadsad");
redisClient.sadd(affairRealationKey, "asdadhas213lhk3l2");

redisClient.smembers('a',showData);



function showData(err, data){
    console.log(data);
}