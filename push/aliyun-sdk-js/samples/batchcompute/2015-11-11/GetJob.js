var batchcompute = require('./batchcompute');

/**
*
*/
var opt = {
    JobId:'job-00000000559638EC00005F780000069A'
};
batchcompute.getJob(opt, function(err, result) {
    console.log(err || result);
});
