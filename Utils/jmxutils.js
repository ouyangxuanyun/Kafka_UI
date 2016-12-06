"use strict";
var jmx = require("jmx");
var jmxutil = new Object();
var async = require('async');


/**
 * @param host
 * @param port
 * @param callback 返回Metrics， 一个二维数组，Metrics[0-5]是以下获取的6个信息，每个信息包含Mean, 1min,5min,15min 4个信息
 * 连接一个broker， 获取这个broker上的MessagesIn，BytesIn，BytesOut，BytesReject，FailFech，FailProduce 6个信息
 */
function connecthost(host, port, callback) {
    var Metrics = [],flag = 0;
    var client = jmx.createClient({
        host: host,
        port: port
    });
    client.connect();
    client.on("connect", function () {
        console.log("jmx connect successful !");
        var Items = ["MessagesInPerSec","BytesInPerSec","BytesOutPerSec",
            "BytesRejectedPerSec","FailedFetchRequestsPerSec","FailedProduceRequestsPerSec"];// 需要计算的属性值
        for (var i = 0; i < 6; i++) {
            !function (i) {
                getmetricrow(client,"kafka.server:type=BrokerTopicMetrics,name=" + Items[i], function (data) {
                    // console.log("MessagesInPerSec" + data)
                    Metrics[i] = data; //MessagesIn
                    flag++;
                    if (flag === 6) callback(null,Metrics)
                });
            }(i);
        }
    });
}

/**
 * @param MBeanname
 * @param callback
 * 得到一行的信息包括： MeanRate,OneMinuteRate,FiveMinuteRate,FifteenMinuteRate,
 */
function getmetricrow(client,MBeanname, callback) {
    var result = [];
    var flag = 0;
    var Items = ["MeanRate","OneMinuteRate","FiveMinuteRate","FifteenMinuteRate"];// 需要计算的属性值
    for (var i = 0; i < 4; i++) {
        !function (i) {
            client.getAttribute(MBeanname, Items[i], function (data) {
                // console.log(data.toString());
                result[i] = data;
                flag++;// console.log(flag)
                if (flag == 4) callback(result);
            });
        }(i)
    }
}

/**
 * @param BrokerList 传入所有的broker
 * @param callback 得到各个broker 6行信息（每行4个）的均值，作为combinedMetric返回
 */
function getcombinedMetrics(BrokerList, callback) {
    var result = [];
    var combinedMetric = new Array();
    var flag = 0;
    for (var i = 0; i < BrokerList.length; i++) {
        !function (i) {
            connecthost(BrokerList[i][1], BrokerList[i][3], function (err,oneHostMetric) { // data是一个二维数组，[MessagesIn,BytesIn,BytesOut…]
                result[i] = oneHostMetric;
                flag++;//console.log(flag);console.log(BrokerList.length);console.log(result); //各个host数据全部计算完毕，flag满足条件进行下一步
                if (flag == BrokerList.length) {
                    var temp = 0;
                    for (var m = 0; m < 6; m++) {
                        combinedMetric[m] = new Array();
                        for (var n = 0; n < 4; n++) {
                            temp = 0;
                            for (var j = 0; j < result.length; j++) {
                                temp += result[j][m][n];
                            }
                            combinedMetric[m][n] = temp;
                        }
                    }
                    callback(null,combinedMetric);
                }
            })
        }(i);
    }
}


/** == add jnn ==
 * @param cluster_arr (集群broker信息的二维数组)
 * @param brokers
 * @param callback returns an array of strings containing MBean info
 *                  {broker: , topic: , name: , partition: , attribute: , value: [, clientid: ]}
 */
function getMBeanList(cluster_arr, brokers, callback) {
    var mbean_list = new Array(),
        broker_arr = new Array()
    for(var i= 0; i< brokers; i++){
        broker_arr.push(i);
    }
    async.each(broker_arr, function(broker_item, callback){
        var host = cluster_arr[broker_item][1],
            port = cluster_arr[broker_item][2],
            client = jmx.createClient({
                host: host,
                port: port
            })
        client.connect();
        client.on("connect", function () {
            //console.log("connect successful !");
            client.listMBeans(function(data){
                //console.log(data.toString());
                //得到单个broker （broker_item）上所有 Mbean 数组（data[]）
                async.each(data, function(mbean_item, callback){
                    var splitstr1 = mbean_item.split(/:/),
                        splitstr2 = splitstr1[1].split(/,/)
                    if ((splitstr1[0]==='kafka.cluster')||(splitstr1[0]==='kafka.log' && splitstr2[3]==='type=Log')){
                        var splitname = splitstr2[0].split(/=/),
                            splittopic = splitstr2[2].split(/=/),
                            splitparti = splitstr2[1].split(/=/),
                            name = splitname[1],
                            topic = splittopic[1],
                            partition = splitparti[1]
                        client.getAttribute(mbean_item, 'Value', function(data){
                            //console.log(mbean_item)
                            mbean_list.push({broker: broker_item, topic: topic, name: name, partition: partition, attribute: 'Value', value: data});
                            callback();
                            //console.log('get MBeanList success : kafka.cluster:type=Partition || kafka.log:type=Log , '+ data)
                        })
                    }
                    else if(splitstr1[0]==='kafka.server' && splitstr2[2]==='type=BrokerTopicMetrics'){
                        var splitname = splitstr2[0].split(/=/),
                            splittopic = splitstr2[1].split(/=/),
                            name = splitname[1],
                            topic = splittopic[1],
                            attribute_arr = ['FifteenMinuteRate','FiveMinuteRate','MeanRate','OneMinuteRate']
                        async.each(attribute_arr, function(attribute_item, callback){
                            client.getAttribute(mbean_item, attribute_item, function(data){
                                mbean_list.push({broker: broker_item, topic: topic, name: name, partition: partition, attribute: attribute_item, value: data});
                                callback();
                                //console.log('get MBeanList success : kafka.server:type=BrokerTopicMetrics, data='+data)
                            })
                        }, function(err){
                            callback();
                            //console.log('get MBeanList success : kafka.server:type=BrokerTopicMetrics)
                        })
                    }
                    else if (splitstr1[0]==='kafka.server' && splitstr2[4]==='type=FetcherLagMetrics'){
                        var splitname = splitstr2[1].split(/=/),
                            splitclientid = splitstr2[0].split(/=/),
                            splittopic = splitstr2[3].split(/=/),
                            splitparti = splitstr2[2].split(/=/),
                            name = splitname[1],
                            clientid = splitclientid[1],
                            topic = splittopic[1],
                            partition = splitparti[1]
                        client.getAttribute(mbean_item, 'Value', function(data){
                            mbean_list.push({broker: broker_item, topic: topic, name: name, partition: partition, attribute: 'Value', value: data, clientid: clientid});
                            callback();
                            //console.log('get MBeanList success : kafka.server:type=FetcherLagMetrics')
                        })
                    }
                    else callback();

                }, function(err){
                    console.log('get MBeanList success on Broker ' + broker_item)
                    callback();
                })
            })
        })
    }, function(err){
        console.log('get all MBeanList success !'+ mbean_list.length)
        callback(mbean_list);
    })
}

/** == add jnn ==
 * @param cluster_arr (集群broker信息的二维数组)
 * @param brokers
 * @param topic_arr
 * @param callback returns an array of strings containing MBean info
 *                  {broker: , topic: , name: , partition: , attribute: , value: [, clientid: ]}
 */
function getJMXdata(cluster_arr, brokers, topic_arr, callback) {
    var result = new Array();

    getMBeanList(cluster_arr, brokers, function(mb_data){
        async.each(topic_arr, function(topic, callback){
            var start_offset = 0,
                end_offset = 0,
                metrics = new Object(),
                BytesInPerSec = [0,0,0,0],
                BytesOutPerSec = [0,0,0,0],
                BytesRejectedPerSec = [0,0,0,0],
                FailedFetchRequestsPerSec = [0,0,0,0],
                FailedProduceRequestsPerSec = [0,0,0,0],
                MessagesInPerSec = [0,0,0,0],
                logStartPartition_arr = new Array(),
                logEndPartition_arr = new Array(),
                underReplicated_arr = new Array(),//++ jnn
                u_r_pnum = 0 //++ jnn
            async.each(mb_data, function(mb_item, callback){
                if(mb_item.topic==topic){
                    if(mb_item.name == 'UnderReplicated') {
                        if(underReplicated_arr.length!=0){
                            async.each(underReplicated_arr, function(partition_item, callback){
                                if (mb_item.partition == partition_item.partition){
                                    if(partition_item.under_replicated == 0 && mb_item.value != 0) {
                                        partition_item.under_replicated = mb_item.value;
                                        u_r_pnum++;
                                    }
                                    callback('the partition is existed!');
                                }
                                else callback();
                            }, function(err){
                                if(err) {
                                    //console.log(err);
                                    callback();
                                }
                                else {
                                    underReplicated_arr.push({partition: mb_item.partition, under_replicated: mb_item.value});
                                    if(mb_item.value != 0) u_r_pnum++;
                                    callback();
                                }
                            })
                        }
                        else {
                            underReplicated_arr.push({partition: mb_item.partition, under_replicated: mb_item.value});
                            if(mb_item.value != 0) u_r_pnum++;
                            callback();
                        }
                    }
                    else if(mb_item.name == 'LogStartOffset') {
                        if(logStartPartition_arr.length!=0){
                            async.each(logStartPartition_arr, function(partition_item, callback){
                                if (mb_item.partition == partition_item){
                                    callback('the partition is existed!');
                                }
                                else callback();
                            }, function(err){
                                if(err) {
                                    //console.log(err);
                                    callback();
                                }
                                else {
                                    logStartPartition_arr.push(mb_item.partition);
                                    start_offset+=mb_item.value;
                                    callback();
                                }
                            })
                        }
                        else {
                            logStartPartition_arr.push(mb_item.partition);
                            start_offset+=mb_item.value;
                            callback();
                        }
                    }
                    else if(mb_item.name == 'LogEndOffset') {
                        if(logEndPartition_arr.length!=0){
                            async.each(logEndPartition_arr, function(partition_item, callback){
                                if (mb_item.partition == partition_item){
                                    callback('the partition is existed!');
                                }
                                else callback();
                            }, function(err){
                                if(err) {
                                    //console.log(err);
                                    callback();
                                }
                                else {
                                    logEndPartition_arr.push(mb_item.partition);
                                    end_offset+=mb_item.value;
                                    callback();
                                }
                            })
                        }
                        else {
                            logEndPartition_arr.push(mb_item.partition);
                            end_offset+=mb_item.value;
                            callback();
                        }
                    }
                    else if(mb_item.name == 'BytesInPerSec') {
                        if(mb_item.attribute == 'FifteenMinuteRate') {
                            BytesInPerSec[3]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'FiveMinuteRate') {
                            BytesInPerSec[2]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'OneMinuteRate') {
                            BytesInPerSec[1]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'MeanRate') {
                            BytesInPerSec[0]+=mb_item.value;
                            callback();
                        }
                    }
                    else if(mb_item.name == 'BytesOutPerSec') {
                        if(mb_item.attribute == 'FifteenMinuteRate') {
                            BytesOutPerSec[3]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'FiveMinuteRate') {
                            BytesOutPerSec[2]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'OneMinuteRate') {
                            BytesOutPerSec[1]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'MeanRate') {
                            BytesOutPerSec[0]+=mb_item.value;
                            callback();
                        }
                    }
                    else if(mb_item.name == 'BytesRejectedPerSec') {
                        if(mb_item.attribute == 'FifteenMinuteRate') {
                            BytesRejectedPerSec[3]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'FiveMinuteRate') {
                            BytesRejectedPerSec[2]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'OneMinuteRate') {
                            BytesRejectedPerSec[1]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'MeanRate') {
                            BytesRejectedPerSec[0]+=mb_item.value;
                            callback();
                        }
                    }
                    else if(mb_item.name == 'FailedFetchRequestsPerSec') {
                        if(mb_item.attribute == 'FifteenMinuteRate') {
                            FailedFetchRequestsPerSec[3]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'FiveMinuteRate') {
                            FailedFetchRequestsPerSec[2]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'OneMinuteRate') {
                            FailedFetchRequestsPerSec[1]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'MeanRate') {
                            FailedFetchRequestsPerSec[0]+=mb_item.value;
                            callback();
                        }
                    }
                    else if(mb_item.name == 'FailedProduceRequestsPerSec') {
                        if(mb_item.attribute == 'FifteenMinuteRate') {
                            FailedProduceRequestsPerSec[3]+=mb_item.value;
                            //console.log('====== '+mb_item.value);
                            callback();
                        }
                        else if(mb_item.attribute == 'FiveMinuteRate') {
                            FailedProduceRequestsPerSec[2]+=mb_item.value;
                            //console.log('====== '+mb_item.value);
                            callback();
                        }
                        else if(mb_item.attribute == 'OneMinuteRate') {
                            FailedProduceRequestsPerSec[1]+=mb_item.value;
                            //console.log('====== '+mb_item.value);
                            callback();
                        }
                        else if(mb_item.attribute == 'MeanRate') {
                            FailedProduceRequestsPerSec[0]+=mb_item.value;
                            //console.log('====== '+mb_item.value);
                            callback();
                        }
                    }
                    else if(mb_item.name == 'MessagesInPerSec') {
                        if(mb_item.attribute == 'FifteenMinuteRate') {
                            MessagesInPerSec[3]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'FiveMinuteRate') {
                            MessagesInPerSec[2]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'OneMinuteRate') {
                            MessagesInPerSec[1]+=mb_item.value;
                            callback();
                        }
                        else if(mb_item.attribute == 'MeanRate') {
                            MessagesInPerSec[0]+=mb_item.value;
                            callback();
                        }
                    }
                    else callback();
                }
                else callback();
            }, function(err){
                metrics.BytesInPerSec = BytesInPerSec
                metrics.BytesOutPerSec = BytesOutPerSec
                metrics.BytesRejectedPerSec = BytesRejectedPerSec
                metrics.FailedFetchRequestsPerSec = FailedFetchRequestsPerSec
                metrics.FailedProduceRequestsPerSec = FailedProduceRequestsPerSec
                metrics.MessagesInPerSec = MessagesInPerSec
                result.push({topic: topic, under_replicas: u_r_pnum, end_offset: end_offset, start_offset: start_offset, offset: (end_offset-start_offset), metrics: metrics})
                callback()
            })
        }, function(err){
            callback(result)
        })
    })
}

/** == add jnn ==
 * @param cluster_arr (集群broker信息的二维数组)
 * @param brokers
 * @param topic
 * @param callback returns an array of strings containing MBean info:
 *        {topic: , logEndPartition_arr: , end_offset: , logStartPartition_arr: , start_offset: , offset: , metrics: }
 */
function getTopicJMXdata(cluster_arr, brokers, topic, callback) {
    var start_offset = 0,
        end_offset = 0,
        metrics = new Object(),
        BytesInPerSec = [0,0,0,0],
        BytesOutPerSec = [0,0,0,0],
        BytesRejectedPerSec = [0,0,0,0],
        FailedFetchRequestsPerSec = [0,0,0,0],
        FailedProduceRequestsPerSec = [0,0,0,0],
        MessagesInPerSec = [0,0,0,0],
        logStartPartition_arr = new Array(),
        logEndPartition_arr = new Array(),
        underReplicated_arr = new Array(),
        u_r_pnum = 0

    getMBeanList(cluster_arr, brokers, function(mb_data){
        async.each(mb_data, function(mb_item, callback){
            if(mb_item.topic==topic){
                if(mb_item.name == 'UnderReplicated') {
                    if(underReplicated_arr.length!=0){
                        async.each(underReplicated_arr, function(partition_item, callback){
                            if (mb_item.partition == partition_item.partition){
                                if(partition_item.under_replicated == 0 && mb_item.value != 0) {
                                    partition_item.under_replicated = mb_item.value;
                                    u_r_pnum++;
                                }
                                callback('the partition is existed!');
                            }
                            else callback();
                        }, function(err){
                            if(err) {
                                //console.log(err);
                                callback();
                            }
                            else {
                                underReplicated_arr.push({partition: mb_item.partition, under_replicated: mb_item.value});
                                if(mb_item.value != 0) u_r_pnum++;
                                callback();
                            }
                        })
                    }
                    else {
                        underReplicated_arr.push({partition: mb_item.partition, under_replicated: mb_item.value});
                        if(mb_item.value != 0) u_r_pnum++;
                        callback();
                    }
                }
                else if(mb_item.name == 'LogStartOffset') {
                    if(logStartPartition_arr.length!=0){
                        async.each(logStartPartition_arr, function(partition_item, callback){
                            if (mb_item.partition == partition_item.partition){
                                callback('the partition is existed!');
                            }
                            else callback();
                        }, function(err){
                            if(err) {
                                //console.log(err);
                                callback();
                            }
                            else {
                                logStartPartition_arr.push({partition: mb_item.partition, start_offset: mb_item.value});
                                start_offset+=mb_item.value;
                                callback();
                            }
                        })
                    }
                    else {
                        logStartPartition_arr.push({partition: mb_item.partition, start_offset: mb_item.value});
                        start_offset+=mb_item.value;
                        callback();
                    }
                }
                else if(mb_item.name == 'LogEndOffset') {
                    if(logEndPartition_arr.length!=0){
                        async.each(logEndPartition_arr, function(partition_item, callback){
                            if (mb_item.partition == partition_item.partition){
                                callback('the partition is existed!');
                            }
                            else callback();
                        }, function(err){
                            if(err) {
                                //console.log(err);
                                callback();
                            }
                            else {
                                logEndPartition_arr.push({partition: mb_item.partition, end_offset: mb_item.value});
                                end_offset+=mb_item.value;
                                callback();
                            }
                        })
                    }
                    else {
                        logEndPartition_arr.push({partition: mb_item.partition, end_offset: mb_item.value});
                        end_offset+=mb_item.value;
                        callback();
                    }
                }
                else if(mb_item.name == 'BytesInPerSec') {
                    if(mb_item.attribute == 'FifteenMinuteRate') {
                        BytesInPerSec[3]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'FiveMinuteRate') {
                        BytesInPerSec[2]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'OneMinuteRate') {
                        BytesInPerSec[1]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'MeanRate') {
                        BytesInPerSec[0]+=mb_item.value;
                        callback();
                    }
                }
                else if(mb_item.name == 'BytesOutPerSec') {
                    if(mb_item.attribute == 'FifteenMinuteRate') {
                        BytesOutPerSec[3]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'FiveMinuteRate') {
                        BytesOutPerSec[2]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'OneMinuteRate') {
                        BytesOutPerSec[1]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'MeanRate') {
                        BytesOutPerSec[0]+=mb_item.value;
                        callback();
                    }
                }
                else if(mb_item.name == 'BytesRejectedPerSec') {
                    if(mb_item.attribute == 'FifteenMinuteRate') {
                        BytesRejectedPerSec[3]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'FiveMinuteRate') {
                        BytesRejectedPerSec[2]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'OneMinuteRate') {
                        BytesRejectedPerSec[1]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'MeanRate') {
                        BytesRejectedPerSec[0]+=mb_item.value;
                        callback();
                    }
                }
                else if(mb_item.name == 'FailedFetchRequestsPerSec') {
                    if(mb_item.attribute == 'FifteenMinuteRate') {
                        FailedFetchRequestsPerSec[3]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'FiveMinuteRate') {
                        FailedFetchRequestsPerSec[2]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'OneMinuteRate') {
                        FailedFetchRequestsPerSec[1]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'MeanRate') {
                        FailedFetchRequestsPerSec[0]+=mb_item.value;
                        callback();
                    }
                }
                else if(mb_item.name == 'FailedProduceRequestsPerSec') {
                    if(mb_item.attribute == 'FifteenMinuteRate') {
                        FailedProduceRequestsPerSec[3]+=mb_item.value;
                        //console.log('====== '+mb_item.value);
                        callback();
                    }
                    else if(mb_item.attribute == 'FiveMinuteRate') {
                        FailedProduceRequestsPerSec[2]+=mb_item.value;
                        //console.log('====== '+mb_item.value);
                        callback();
                    }
                    else if(mb_item.attribute == 'OneMinuteRate') {
                        FailedProduceRequestsPerSec[1]+=mb_item.value;
                        //console.log('====== '+mb_item.value);
                        callback();
                    }
                    else if(mb_item.attribute == 'MeanRate') {
                        FailedProduceRequestsPerSec[0]+=mb_item.value;
                        //console.log('====== '+mb_item.value);
                        callback();
                    }
                }
                else if(mb_item.name == 'MessagesInPerSec') {
                    if(mb_item.attribute == 'FifteenMinuteRate') {
                        MessagesInPerSec[3]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'FiveMinuteRate') {
                        MessagesInPerSec[2]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'OneMinuteRate') {
                        MessagesInPerSec[1]+=mb_item.value;
                        callback();
                    }
                    else if(mb_item.attribute == 'MeanRate') {
                        MessagesInPerSec[0]+=mb_item.value;
                        callback();
                    }
                }
                else callback();
            }
            else callback();
        }, function(err){
            metrics.BytesInPerSec = BytesInPerSec
            metrics.BytesOutPerSec = BytesOutPerSec
            metrics.BytesRejectedPerSec = BytesRejectedPerSec
            metrics.FailedFetchRequestsPerSec = FailedFetchRequestsPerSec
            metrics.FailedProduceRequestsPerSec = FailedProduceRequestsPerSec
            metrics.MessagesInPerSec = MessagesInPerSec
            callback({topic: topic, underReplicated_arr: underReplicated_arr, under_replicated: u_r_pnum, logEndPartition_arr: logEndPartition_arr, end_offset: end_offset, logStartPartition_arr: logStartPartition_arr, start_offset: start_offset, offset: (end_offset-start_offset), metrics: metrics})
        })
    })
}


jmxutil.getMBeanList=getMBeanList;// == add jnn ==
jmxutil.getJMXdata=getJMXdata;// == add jnn ==
jmxutil.getTopicJMXdata=getTopicJMXdata;// == add jnn ==
jmxutil.connecthost = connecthost;
jmxutil.getcombinedMetrics = getcombinedMetrics;
module.exports = jmxutil;



