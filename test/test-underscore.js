var _ = require('underscore');

var arr = [1];

_.each(arr, function (val) {
    console.log(val);
});

var obj = {
    'name': 'jack',
    'age': 9,
    'home': 'jiangxi'
};

console.log(_.keys(obj));



