var mysql = require('mysql'),
    mysqlCfg = require('../realtime/mysqlCfg.json'),
    _ = require('underscore');

var db = mysql.createConnection(mysqlCfg);

db.on('error', function (error) {
    console.error(error);
});


db.query('SELECT role_id FROM discuss_group_member WHERE group_id = ?',
    ['1c7074f4-8ae9-4dac-89de-673fd740a614'],
    function (err, info) {
        if(err){
            console.log(err);
        }else{
            _.each(info, function(item){
                console.log(item.role_id == '1719de6a-3011-4536-8f30-9780ffda6cff');
            });
        }
    });