var express = require('express')
    , router = express.Router()
    , _ = require('underscore')
    , appService = require('../realtime/apps')
    , roomService = require('../realtime/room')
    , Promise = require('promise')
    , channel = require('../realtime/channel')
    , consts = require('../realtime/consts')
    , RoomInfo = require('../realtime/models').RoomInfo;

var handlers = {

};

/* GET users listing. */
router.post('/', function (req, res, next) {
    var body = req.body;
    if (!body.method) {
        res.status(501);
        res.end('wrong request body');
        return;
    }
    if (!body.params) {
        res.status(501);
        res.end('request body need params');
        return;
    }
    //调用消息方法
    var handler = handlers[body.method];
    if (_.isFunction(handler)) {
        handler(body.params)
            .then(function (result) {
                res.end(JSON.stringify(result));
            }, function (err) {
                res.end(501, err + '');
            });
    } else {
        res.status(501);
        res.end("Can't find method " + body.method);
    }
});

module.exports = router;
