var models = require('../realtime/models'),
    Message = models.Message,
    LastReadTime = models.LastReadTime;


Message.find({name : 1}, function (error, res) {
   console.log(res); 
});

LastReadTime.find({}, function (error, res) {
    console.log(res);
});

LastReadTime.count({}, function (error, res) {
    console.log(res);
});

