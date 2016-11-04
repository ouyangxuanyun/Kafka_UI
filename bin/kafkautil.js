"use strict";
var KafkaRest = require('kafka-rest'),
    argv = require('minimist')(process.argv.slice(2)),
    async = require('async');
var api_url = argv.url || "http://10.192.33.76:8082";
var help = (argv.help || argv.h);
var jmx = require("jmx");
var client = jmx.createClient({
    host: "10.192.33.69", // optional
    port: 9998
});

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

function listTopicPartitions(broid, topicList, callback) {
    var perTopicDetail = [];
    if (topicList == null || topicList.length == 0) {
        console.log("Didn't find any topics, skipping listing partitions.");
        callback(perTopicDetail);
    }
    // name,repliccation, totalparti, onbros,partis
    var i = 0;
    for (; i < topicList.length; i++) {
        kafka.topic(topicList[i]).partitions.list(function (err, data) {
            if (err) {
                console("Failed to list partitions: " + err);
            } else {
                var list = new Object();
                list.partitions = new Array();
                for (var j = 0; j < data.length; j++) {
                    //console.log(data[j].toString() + " (raw: " + JSON.stringify(data[j].raw) + ")");
                    // console.log(data[j].raw.partition)
                    var replicabro = [];
                    // var replicalen = data[j].raw.partition
                    var replicas = data[j].raw.replicas;
                    for (var k = 0; k < replicas.length; k++) {
                        replicabro.push(replicas[k].broker)
                    }
                    //console.log("######## " + replicabro);
                    if (data[j].raw.partition == broid || (replicabro.indexOf(broid) > -1)) {
                        list.partitions.push(data[j].raw.partition);
                    }
                }
                //console.log("******* " + list.partitions)
                if (list.partitions.length) {
                    list.name = data[0].topic.name;
                    list.replicationlen = data[0].raw.replicas.length;
                    list.partitionslen = data.length;
                    list.paronbro = list.partitions.length;
                    list.skewed = false;
                }
                console.log("~~~~~~~TopicName: " + list.name + "  Replication:" + list.replicationlen + "  Total Partitions:" +
                    list.partitionslen + "  Partitions on Brokers:" + list.paronbro + "  Skewed:" + list.skewed +
                    "  Partitions:" + list.partitions)
                perTopicDetail.push(list);
                if (topicList.length == perTopicDetail.length) {
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