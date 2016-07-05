var caches = require('../realtime/caches');


caches.ifPeerAffairRelation('aa8af1fa-bdde-4ecb-a87b-6bcfa91b5ce3',
    'ea0ee39c-3ebf-45f2-8c34-7a594def2150',
    '71d97697-b455-4ea3-b112-45d35d7b96ea').then(function (res) {
    console.log(res);
}, function (error) {
    
});

caches.getGroupMemberList('1c7074f4-8ae9-4dac-89de-673fd740a614').then(function (data) {
    console.log(data);
}, function (error) {

});

