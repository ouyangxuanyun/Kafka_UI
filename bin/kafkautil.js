"use strict";
var KafkaRest = require('kafka-rest');
var argv = require('minimist')(process.argv.slice(2));
var api_url = argv.url || "http://10.192.33.76:8082";
var help = (argv.help || argv.h);

if (help) {
    console.log("Demonstrates accessing a variety of Kafka cluster metadata via the REST proxy API wrapper.");
    console.log();
    console.log("Usage: node metadata.js [--url <api-base-url>]");
    process.exit(0);
}
var kafkautil = new Object();
var kafka = new KafkaRest({"url": api_url});

function listBrokers(callback) {
    var result = new Array();
    kafka.brokers.list(function (err, data) {
        if (err) {
            console.log("Failed trying to list brokers: " + err);
        } else {
            for (var i = 0; i < data.length; i++)
                //console.log(data[i].toString() + " (raw: " + JSON.stringify(data[i].raw) + ")");
                result.push(data[i].id)
        }
        callback(result)
    });
}

function listTopics(callback) {
    var topicList = new Array();
    kafka.topics.list(function (err, data) {
        if (err) {
            console("Failed to list topics: " + err);
        } else {
            for (var i = 0; i < data.length; i++)
                //console.log(data[i].toString() + " (raw: " + JSON.stringify(data[i].raw) + ")");
                topicList.push(data[i].name)
        }
        callback(topicList);
    });
}

/**
 *
 * @param broid      传入的broker ID
 * @param topicList 传入的topic列表
 * @param callback  返回perTopicDetail数组[summary标题栏的Topics, summary标题栏的Partitions, list对象1，list对象2，……]
 * list 对象包含底部栏Per Topic Detail的信息，
 */
function listTopicPartitions(broid, topicList, callback) {
    var perTopicDetail = [0, 0];// [BrokerIdSummary_Topics ,BrokerIdSummary_Partitions]
    var BrokerIdSummary_Topics = 0;
    var BrokerIdSummary_Partitions = 0;

    if (topicList == null || topicList.length == 0) {
        console.log("Didn't find any topics, skipping listing partitions.");
        callback(perTopicDetail);
    }
    //以下是获取在此broker上的每个topic的信息：包括name，replication，partitions，partitionsOnBroker,partitions,skew
    var i = 0;
    for (; i < topicList.length; i++) {
        kafka.topic(topicList[i]).partitions.list(function (err, data) {
            if (err) {
                console("Failed to list partitions: " + err);
            } else {
                var list = new Object();
                list.partitions = new Array();
                for (var j = 0; j < data.length; j++) { //获取partitions
                    //console.log(data[j].toString() + " (raw: " + JSON.stringify(data[j].raw) + ")");console.log(data[j].raw.partition)
                    var replicabro = [];// var replicalen = data[j].raw.partition
                    var replicas = data[j].raw.replicas;
                    for (var k = 0; k < replicas.length; k++) {
                        replicabro.push(replicas[k].broker)
                    }//console.log("######## " + replicabro);
                    if ((replicabro.indexOf(broid) > -1)) { // if (data[j].raw.partition == broid ||(replicabro.indexOf(broid) > -1))
                        list.partitions.push(data[j].raw.partition);
                    }
                }//console.log("******* " + list.partitions)
                if (list.partitions.length) { //获取topic的其他信息
                    BrokerIdSummary_Topics++;
                    list.name = data[0].topic.name;
                    list.replicationlen = data[0].raw.replicas.length;
                    list.partitionslen = data.length;
                    list.paronbro = list.partitions.length;
                    list.skewed = "????";
                    BrokerIdSummary_Partitions += list.partitions.length;
                }
                // console.log("~~~~~~~TopicName: " + list.name + "  Replication:" + list.replicationlen + "  Total Partitions:" +
                //     list.partitionslen + "  Partitions on Brokers:" + list.paronbro + "  Skewed:" + list.skewed +
                //     "  Partitions:" + list.partitions)
                perTopicDetail.push(list);
                if (topicList.length == perTopicDetail.length - 2) {
                    perTopicDetail[0] = BrokerIdSummary_Topics
                    perTopicDetail[1] = BrokerIdSummary_Partitions
                    callback(perTopicDetail);
                }
            }
        });
    }
}


kafkautil.getbrokerlist = listBrokers;
kafkautil.listTopics = listTopics;
kafkautil.listTopicPartitions = listTopicPartitions;
module.exports = kafkautil;