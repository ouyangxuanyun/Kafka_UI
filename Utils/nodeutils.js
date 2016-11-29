"use strict";
var connstr = '10.192.33.57:2181,10.192.33.69:2181,10.192.33.76:2181',
    kafkaNode = require('kafka-node'),
    client = new kafkaNode.Client(connstr),
    offset = new kafkaNode.Offset(client),
    Producer = kafkaNode.Producer;
var nodeutils = new Object();

/**
 * 获取指定topic 各个partition的LogSize
 * @param topic
 * @param callback 数组[key(partition),value(LogSize)]
 */
function getPartitionOffset(topic, callback) {
    offset.fetchLatestOffsets([topic], function (error, offsets) {
        var result = [];
        if (error) return handleError(error);
        //console.log(offsets);//console.log(offsets[topic][partition]);
        var i = 0;
        while (offsets[topic][i] != undefined) {
            result[i] = offsets[topic][i];
            i++;
        }//console.log("---------------------getPartitionOffset run")
        callback(result)
    });
}

/**
 * 创建topic
 * @param topicname
 * @param callback
 */
function createTopic(topicname, callback) {
    var producer = new Producer(client)
    producer.createTopics(topicname, false, function (err, data) {
        if (err) {
            console.log('Error: While writing message to Kafka', err)
            res.render('createtopicresult', err);
        }
        else {//console.log('create topic  ' + topic_name + 'successfully!');
            callback();
        }
    });
}

nodeutils.getPartitionOffset = getPartitionOffset;
nodeutils.createTopic = createTopic;
module.exports = nodeutils;
