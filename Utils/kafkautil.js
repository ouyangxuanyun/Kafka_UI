"use strict";
var KafkaRest = require('kafka-rest');
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');
var api_url = argv.url || "http://10.192.33.76:8082"; //kafka-restful proxy
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

function getlistlen(callback) {
    kafka.topics.list(function (err, data) {
        if (err) {
            console("Failed to list topics: " + err);
            return;
        }
        callback(data.length);
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
        callback(null,perTopicDetail);
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
                    callback(null,perTopicDetail);
                }
            }
        });
    }
}


function getTopicList(callback) {
    var topicList = new Array(),
        brokerList = new Array(),
        brokers = 0;
    kafka.topics.list(function (err, data) {
        if (err) {
            console("Failed to list topics: " + err);
            callback(err);
        } else {
            kafka.brokers.list(function (err, b_data) {
                if (err) {
                    console.log('Failed to get brokers list :' + err);
                }
                else {
                    brokers = b_data.length;
                    for (var i= 0; i< brokers; i++){
                        brokerList.push(b_data[i].id);
                    }
                }
                for (var i = 0; i < data.length; i++)
                {
                    //console.log(data[i].toString() + " (raw: " + JSON.stringify(data[i].raw) + ")");
                    topicList.push(data[i].name)
                }
                callback({topicList: topicList, brokerList: brokerList});
            });
        }

    });
}


/* GET topic detail. */
function getTopicSummary (topic, callback) {
    var topicDetail = new Object();
    var brokers = 0; //number of brokers for cluster
    var clusterBrokerList = new Array();

    kafka.brokers.list(function (err, b_data) {
        if (err) {
            console.log('Failed to get brokers list :' + err);
        }
        else {
            brokers = b_data.length;
            for (var i= 0; i< brokers; i++){
                clusterBrokerList.push(b_data[i].id);
            }
        }
        kafka.topics.get(topic, function (err, t_data) {
            if (err) {
                console.log('Failed to get topic info of ' + topic + ': ' +  err);
                callback(err);
            }
            else {
                var partitions = t_data.raw.partitions.length; //number of partitions
                var p_r_num = 0;//number of preferred replicas
                var b_arry = new Array();
                b_arry[0] = t_data.raw.partitions[0].replicas[0].broker;
                var t_brokers = 1;//number of brokers for topic
                for(var m= 0; m< t_data.raw.partitions.length; m++) {
                    for(var n= 0; n< t_data.raw.partitions[m].replicas.length; n++) {
                        var flag= false;
                        if (t_data.raw.partitions[m].replicas[0].leader) { p_r_num++; }
                        for(var l= 0; l<b_arry.length; l++) {
                            if (t_data.raw.partitions[m].replicas[n].broker == b_arry[l]) {
                                flag =true;
                                break;
                            }
                        }
                        if (flag== false) {
                            b_arry.push(t_data.raw.partitions[m].replicas[n].broker);
                            //console.log(b_arry);

                        }
                    }
                }

                b_arry.sort();
                var b_p_list= new Array();//partition list on broker list for topic
                var broker_list= new Array();//==
                for(var i= 0; i< b_arry.length; i++) {
                    var p_list= new Array();
                    var partitons_list= new Array();//==
                    var broker_paritions = new Object();//==
                    for (var m= 0; m< t_data.raw.partitions.length; m++) {
                        for (var n= 0; n< t_data.raw.partitions[m].replicas.length; n++) {
                            if (t_data.raw.partitions[m].replicas[n].broker== b_arry[i]) {
                                p_list.push({parititonID: t_data.raw.partitions[m].partition});
                                partitons_list.push(t_data.raw.partitions[m].partition);//==
                            }
                        }
                    }
                    broker_paritions.broker = b_arry[i];//==
                    broker_paritions.parititions = partitons_list.length;//==
                    partitons_list.sort();//==
                    var list = new String();
                    for (var j= 0; j< partitons_list.length; j++){
                        if (j == 0) list += '(';
                        if (j != 0) list += ',';
                        list += partitons_list[j];
                        if (j == partitons_list.length - 1) list += ')'
                    }
                    broker_paritions.partition_list = partitons_list;//==
                    broker_paritions.list = list;//==
                    broker_list.push(broker_paritions);//==
                    b_p_list.push({broker: b_arry[i], partitions: p_list})
                }

                var broker_partition_list = new Array();//去掉broker_list中服务宕了的broker
                for (var ii= 0; ii< broker_list.length; ii++){
                    for (var jj= 0; jj< clusterBrokerList.length; jj++){
                        //console.log('!!!!!!!!!!!! broker_list['+ii+'].broker'+broker_list[ii].broker+', clusterBrokerList['+jj+']'+clusterBrokerList[jj])
                        if (broker_list[ii].broker == clusterBrokerList[jj]){
                            broker_partition_list.push(broker_list[ii]);
                        }
                    }
                }
                var t_brokers = broker_partition_list.length;//number of brokers for topic

                var partitions_list = new Array();

                for (var i= 0; i< t_data.raw.partitions.length; i++) {
                    var p_info = new Object();
                    var r_list = new String();
                    var isr = new String();
                    for(var j= 0; j< t_data.raw.partitions[i].replicas.length; j++){
                        if (j == 0) {
                            r_list += '(';
                            isr += '(';
                        }
                        if (j != 0) {
                            r_list += ',';
                            isr += ',';
                        }
                        if (t_data.raw.partitions[i].replicas[j].in_sync) isr += t_data.raw.partitions[i].replicas[j].broker;
                        r_list += t_data.raw.partitions[i].replicas[j].broker;
                        if (j == t_data.raw.partitions[i].replicas.length - 1) {
                            r_list += ')';
                            isr += ')';
                        }
                    }

                    p_info.parition_id = t_data.raw.partitions[i].partition;
                    p_info.leader = t_data.raw.partitions[i].leader;
                    p_info.replica_list = r_list;
                    p_info.isr_list = isr;
                    p_info.prefferedLeader = t_data.raw.partitions[i].replicas[0].leader;//is preffered leader or not?
                    partitions_list.push(p_info);
                }

                var brokerSkewed = 0;//broker skewed %
                if (partitions > t_brokers && t_brokers!=0 ) brokerSkewed = 100-Math.round(t_brokers*100/brokers);

                topicDetail.name = topic; //topic name
                topicDetail.partitions = partitions; //number of partitions
                topicDetail.t_brokers = t_brokers; //number of brokers for topic
                topicDetail.brokers = brokers; //number of brokers for cluster
                //topicDetail.b_p_list = b_p_list;//broker list for topic
                topicDetail.broker_list = broker_partition_list;//broker list for topic, list is a string
                topicDetail.prefferedReplicas = Math.round(p_r_num*100/partitions);//preferred replicas %
                topicDetail.brokerSpread = Math.round(t_brokers*100/brokers); //broker spread %
                topicDetail.brokerSkewed = brokerSkewed;//broker skewed %
                topicDetail.replicas = t_data.raw.partitions[0].replicas.length;//number of replicas
                topicDetail.partitions_list = partitions_list;//partitions info
                topicDetail.leaderSize = '';

                callback(topicDetail);
            }
        });
    });

}


kafkautil.getTopicList=getTopicList;// == add jnn ==
kafkautil.getTopicSummary = getTopicSummary;// == add jnn ==
kafkautil.getbrokerlist = listBrokers;
kafkautil.listTopics = listTopics;
kafkautil.listTopicPartitions = listTopicPartitions;
kafkautil.getlistlen = getlistlen;
kafkautil.getTopicSummary = getTopicSummary;
module.exports = kafkautil;

