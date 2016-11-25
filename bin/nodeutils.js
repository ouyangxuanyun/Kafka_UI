var kafka2connstr = '10.192.33.57:2181,10.192.33.69:2181,10.192.33.76:2181';
var kafka2 = require('kafka-node'),
    client = new kafka2.Client(kafka2connstr),
    offset = new kafka2.Offset(client);
var nodeutils = new Object();


function getPartitionOffset(topic,callback) {
    offset.fetchLatestOffsets([topic], function (error, offsets) {
        var result = [];
        if (error) return handleError(error);
        //console.log(offsets);//console.log(offsets[topic][partition]);
        var i = 0;
        while (offsets[topic][i] != undefined) {
            result[i] = offsets[topic][i];
            i++;
        }
        console.log("---------------------getPartitionOffset run")
        callback(result)
    });
}


// getPartitionOffset("__consumer_offsets",function (data) {
//     console.log("__consumer_offsets")
//     console.log(data)
// });
// getPartitionOffset("logstash",function (data) {
//     console.log("logstash")
//     console.log(data)
// });
// getPartitionOffset("logstashtest",function (data) {
//     console.log("logstashtest")
//     console.log(data)
// });



nodeutils.getPartitionOffset = getPartitionOffset;
module.exports = nodeutils;
