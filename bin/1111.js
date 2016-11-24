var kafka2connstr = '10.192.33.57:2181,10.192.33.69:2181,10.192.33.76:2181';
var kafka2 = require('kafka-node'),
    client = new kafka2.Client(kafka2connstr),
    offset = new kafka2.Offset(client);
var partition = 0;
var topic = 'test';
offset.fetchLatestOffsets([topic], function (error, offsets) {
    if (error)
        return handleError(error);
    console.log(offsets);
});
//
// offset.fetch([
//     { topic: 'test', partition: 0, time: Date.now(), maxNum: 1 }
// ], function (err, data) {
//     console.log(data);
//     // { 't': { '0': [999] } }
// });
