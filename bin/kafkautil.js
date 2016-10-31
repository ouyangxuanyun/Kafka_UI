"use strict";

var KafkaRest = require('kafka-rest'),
    argv = require('minimist')(process.argv.slice(2)),
    async = require('async');
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
        //console.log(result.length)
        callback(result)
        //return result;
        //console.log();
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

function listTopicPartitions(topicList) {
    var broid = 1;
    if (topicList == null || topicList.length == 0) {
        console.log("Didn't find any topics, skipping listing partitions.");
        callback();
    }
    // name,repliccation, totalparti, onbros,partis
    var perTopicDetail = [];
    for (var i = 0; i < topicList.length; i++) {
        kafka.topic(topicList[i]).partitions.list(function (err, data) {
            if (err) {
                console("Failed to list partitions: " + err);
            } else {
                var list = new Object();
                list.name = data[0].topic.name;
                list.replicationlen = data[0].raw.replicas.length;
                list.partitionslen = data.length;
                list.partitions = new Array();

                for (var j = 0; j < data.length; j++) {
                    console.log(data[j].toString() + " (raw: " + JSON.stringify(data[j].raw) + ")");
                    console.log(data[j].raw.partition)
                    var replicabro = [];
                    // var replicalen = data[j].raw.partition
                    var replicas = data[j].raw.replicas;
                    for (var k = 0; k < replicas.length; k++) {
                        replicabro.push(replicas[k].broker)
                    }
                    //console.log(replicabro);
                    if (data[j].raw.partition == broid || (replicabro.indexOf(broid) > -1)) {
                        if(data[j].raw.partition)
                        list.partitions.push(data[j].raw.partition);
                    }
                    // perTopicDetail.name.push(data[i].topic.name);
                    // perTopicDetail.detail.push(data[i].topic.name);
                    //console.log("replication:" + data[j].raw);
                }
                console.log(list.partitions)

            }
            // console.log("name:" + data[0].topic.name)
            // console.log("partitions:" + data.length);
            // console.log("replications:" + data[0].raw.replicas.length);
        });
    }
}

kafkautil.getbrokerlist = listBrokers;
kafkautil.listTopics = listTopics;
kafkautil.listTopicPartitions = listTopicPartitions;
module.exports = kafkautil;