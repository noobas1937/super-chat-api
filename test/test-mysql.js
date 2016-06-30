var mysql = require('mysql'),
    mysqlCfg = require('../realtime/mysqlCfg.json'),
    _ = require('underscore');

var db = mysql.createConnection(mysqlCfg);

db.on('error', function (error) {
    console.error(error);
});


db.query('SELECT user_id FROM discuss_group_member WHERE group_id = ?',
    ['1c7074f4-8ae9-4dac-89de-673fd740a614'],
    function (err, info) {
        if(err){
            console.log(err);
        }else{
            console.log('-------------group user_ids------------');
            _.each(info, function(item){
                console.log(item.user_id);
            });
        }
    });

db.query('SELECT role_id FROM discuss_group_member WHERE group_id = ?',
    ['1c7074f4-8ae9-4dac-89de-673fd740a614'],
    function (err, info) {
        if(err){
            console.log(err);
        }else{
            console.log('-------------group user_ids------------');
            _.each(info, function(item){
                console.log(item.role_id);
            });
        }
    });

db.query('SELECT user_id FROM affair_member WHERE affair_id = ?',
    ['71d97697-b455-4ea3-b112-45d35d7b96ea'],
    function (err, info) {
        if(err){
            console.log(err);
        }else{
            console.log('-------------affair user_ids------------');
            _.each(info, function(item){
                console.log(item.user_id);
            });
        }
    });

db.query('SELECT role_id FROM affair_member WHERE affair_id = ?',
    ['71d97697-b455-4ea3-b112-45d35d7b96ea'],
    function (err, info) {
        if(err){
            console.log(err);
        }else{
            console.log('-------------affair role_ids------------');
            _.each(info, function(item){
                console.log(item.role_id);
            });
        }
    });
