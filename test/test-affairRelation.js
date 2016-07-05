var mysqlService = require('../realtime/mysql-service');


mysqlService.ifInSameAffair('aa8af1fa-bdde-4ecb-a87b-6bcfa91b5ce3',
    'ea0ee39c-3ebf-45f2-8c34-7a594def2150',
    '71d97697-b455-4ea3-b112-45d35d7b96ea').then(function (res) {
        console.log(res);
}, function (error) {

});