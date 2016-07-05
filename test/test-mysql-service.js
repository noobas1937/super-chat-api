var service = require('../realtime/mysql-service');

service.getGroupMembers('1c7074f4-8ae9-4dac-89de-673fd740a614').then(function(data){
    console.log(data);
});

