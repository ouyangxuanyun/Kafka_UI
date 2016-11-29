"use strict";
var express = require('express');
var router = express.Router();
var fs = require('fs');
var kafka = require('../Utils/kafkautil');
var jmxutil = require('../Utils/jmxutils');
var zkutil = require('../Utils/zkutils');
var nodeutils = require('../Utils/nodeutils')
var async = require('async');

var testInfo = require('../test/gettestInfo')
var AllCluster = [];
AllCluster.length = 1;  // 全局存储创建的cluster 信息
AllCluster["test111"] = testInfo();// console.log(AllCluster["test"])

var BrokerList = ""; //全局，提供给topic list页面 和 brokers页面
var Broker_List = [];//给topic页面连接信息

/* 获取Broker的IP 端口等信息*/
zkutil.getBrokerList(function (_BrokerList) {
    BrokerList = _BrokerList;
    for (var lnum = 0; lnum < BrokerList.length; lnum++) {
        !function (lnum) {
            var ltemp = [];
            ltemp.push(lnum + 1);
            ltemp.push(BrokerList[lnum][1]);
            ltemp.push(BrokerList[lnum][3]);
            Broker_List[lnum] = ltemp;
        }(lnum)
    }//console.log(Broker_List)
});

/*显示clusters list 信息， homepage页*/
router.get('/', function (req, res, next) {
    var clusters = [];
    for (var key in AllCluster) {
        var cluster = new Object();
        cluster.name = key;
        cluster.kafkaVersion = AllCluster[key]["kafkaVersion"];
        cluster.zkHosts = AllCluster[key]["zkHosts"];
        cluster.operation = AllCluster[key]["operation"];
        clusters.push(cluster);// console.log(cluster.name,cluster.kafkaVersion,cluster.zkHosts,cluster.operation);
    }
    res.render('clusters', {clusters: clusters});
});


/* 添加cluster页面*/
router.get('/addCluster', function (req, res, next) {
    res.render('addcluster');
});


/* 获取表单提交的数据处理后存入attresult 数组，详细见README/1.*/
router.get('/clusters', function (req, res, next) {
    var checkedkey = ["logkafkaEnabled", "pollConsumers", "filterConsumers", "activeOffsetCacheEnabled", "displaySizeEnabled"];
    var attresult = [];
    var attsjson = req.query;// console.log(attsjson);
    var clustername = req.query.name
    attresult["clustername"] = clustername;
    attresult["zkHosts"] = attsjson.zkHosts; //因为zkHost里面有：，会影响下面继续以：为分隔符进行分割，先保存
    var attsstr = JSON.stringify(attsjson);//console.log(attsstr)
    var arrs = attsstr.slice(1, -1).split(",");
    for (var i = 2; i < arrs.length; i++) {
        var temp = arrs[i].split(":");
        attresult[temp[0].slice(1, -1)] = temp[1].slice(1, -1)
    }
    for (var j = 0; j < checkedkey.length; j++) {
        !function (j) {
            if (attresult.hasOwnProperty(checkedkey[j])) {
                attresult["check_" + checkedkey[j]] = "checked";
            } else {
                attresult["check_" + checkedkey[j]] = "";
            }
        }(j)
    }//console.log(attresult);
    AllCluster[attresult["clustername"]] = attresult;
    AllCluster.length++;
    res.render('changeclusterresult', {title: "Add Cluster", clustername: clustername})
});


/*每个cluster详情页*/
router.get('/clusters/:clustername', function (req, res, next) {
    var clusterInfoname = req.params.clustername;
    zkutil.getbrokernumbers(function (bronum) {
        kafka.getlistlen(function (listlen) {
            res.render('clusterInfo', {
                clusterInfoname: clusterInfoname,
                listlen: listlen,
                bronum: bronum,
                clusterInfo: AllCluster[clusterInfoname]
            });
        });
    })
});


/*Cluster Modify 页面 */
router.get('/updateCluster', function (req, res, next) {
    console.log(req.query.c);//获取要修改的cluster name
    var modifyname = req.query.c;
    var originInfo = AllCluster[modifyname];
    res.render('updateCluster', {modifyname: modifyname, originInfo: originInfo});
});

/* Clusters 页面增删改  Modify/Disable/Enable/Delete,　update页面save按钮 或者Cluster页面Disable，Enable，Delete按钮*/
router.post('/clusters/:clustername', function (req, res, next) {
    var clustername = req.body.name;
    var checkedkey = ["logkafkaEnabled", "pollConsumers", "filterConsumers", "activeOffsetCacheEnabled", "displaySizeEnabled"];
    var attsjson = req.body;
    var changedInfo = AllCluster[clustername];//console.log(changedInfo);

    if (req.body.operation == "Update") {//console.log("Update 提交了表单");
        changedInfo["operation"] = "Update";
        changedInfo["zkHosts"] = attsjson.zkHosts;
        var attsstr = JSON.stringify(attsjson);//console.log("转成字符串" + attsstr)
        var arrs = attsstr.slice(1, -1).split(",");//console.log("分割成数组" + arrs)
        for (var j = 0; j < checkedkey.length; j++) {// console.log("删除已经加入的checked");
            changedInfo["check_" + checkedkey[j]] = "";
        }
        for (var i = 3; i < arrs.length; i++) { //要从zkHost后一位开始以：分割，此时zhHosts的位置是2,
            var temp = arrs[i].split(":");
            var key = temp[0].slice(1, -1);
            var value = temp[1].slice(1, -1);
            changedInfo[key] = value;
            if (checkedkey.indexOf(key) > -1) {// console.log("有checked 选项" + key)
                changedInfo["check_" + key] = "checked";
            }
        }
        res.render('changeclusterresult', {title: "Update Cluster", clustername: clustername})
    }

    if (req.body.operation == "Disable") {//console.log("Disable 提交了表单");
        changedInfo["operation"] = "Disable"
        res.render('changeclusterresult', {title: "Disable Cluster", clustername: clustername})
    }

    if (req.body.operation == "Enable") {//console.log("Enable 提交了表单");
        changedInfo["operation"] = "Enable"
        res.render('changeclusterresult', {title: "Enable Cluster", clustername: clustername})
    }

    if (req.body.operation == "Delete") {//console.log("Delete 提交了表单");
        delete(AllCluster[clustername]);
        res.render('changeclusterresult', {title: "Delete Cluster", clustername: clustername})
    }
})

/* GET topic list page. */
router.get('/clusters/:clustername/topics', function (req, res, next) {
    var clustername = req.params.clustername;
    var topicList = new Array();

    kafka.getTopicList(function (t_data) {
        var brokers = t_data.brokerList.length;
        //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~brokers num ' + brokers +', list '+t_data.brokerList)
        var count_tt = 0;
        jmxutil.getJMXdata(Broker_List, brokers, t_data.topicList, function (jmx_data) {
            async.each(jmx_data, function (jmx_item, callback) {
                var topic_name = jmx_item.topic;
                kafka.getTopicSummary(topic_name, function (ts_data) {
                    ts_data.offset = jmx_item.end_offset;
                    ts_data.producerMsg = jmx_item.metrics.MessagesInPerSec[0]
                    topicList.push(ts_data);
                    callback();
                })
            }, function (err) {
                res.render('topiclist', {topicList: topicList, clustername: clustername});
            })
        })
    });
});

/* GET each topic details . */
router.get('/clusters/:clustername/topics/:topic_name', function (req, res, next) {
    var clustername = req.params.clustername;
    var topic_name = req.params.topic_name;
    var topicdetails = new Object();
    kafka.getTopicSummary(topic_name, function (ts_data) {
        jmxutil.getTopicJMXdata(Broker_List, ts_data.brokers, topic_name, function (jmx_data) {
            zkutil.filterconsumers(topic_name, function (consumers) { //一维数组，Consumers consuming from this topic的结果
                //console.log(consumers);
                topicdetails.offset = jmx_data.end_offset;
                topicdetails.logPartition_arr = jmx_data.logEndPartition_arr;//console.log(topicdetails.logPartition_arr)
                topicdetails.metrics = jmx_data.metrics;
                topicdetails.topicSummary = ts_data;
                res.render('topicdetails', {
                    topicdetails: topicdetails,
                    clustername: clustername,
                    topic_name: topic_name,
                    consumers: consumers
                });
            })
        })
    });
});

/* topic create result page. */
router.get('/clusters/:clustername/createTopic', function (req, res, next) {
    var clustername = req.params.clustername;
    res.render('createtopic', {clustername: clustername});
});

/* topic create result page. */
router.get('/clusters/:clustername/createResult', function (req, res, next) {
    var clustername = req.params.clustername;
    var topic_name = req.query.topic;
    nodeutils.createTopic(topic_name, function () {
        res.render('createtopicresult', {topic_name: topic_name, clustername: clustername});
    })
});


/* Broker list 页面*/
router.get('/clusters/:clustername/brokers', function (req, res, next) {
    var clustername = req.params.clustername;
    zkutil.getBrokerList(function (_BrokerList) {
        BrokerList = _BrokerList;
        jmxutil.getcombinedMetrics(BrokerList, function (err, combinedMetrics) {
            res.render('brokers', {
                clustername: clustername,
                combinedMetrics: combinedMetrics,
                BrokerList: BrokerList
            })
        });
    });
});

/*Broker 详细页面 嵌套回调函数方法*/
// router.get('/clusters/:clustername/brokers/:brokerlistId', function (req, res, next) {
//     var clustername = req.params.clustername;
//     var brokerlistId = req.params.brokerlistId;
//     var broid = BrokerList[brokerlistId - 1][0] + 1;
//     var host = BrokerList[brokerlistId - 1][1];
//     var port = BrokerList[brokerlistId - 1][3];
//
//     jmxutil.connecthost(host, port, function (err,metrics) {
//         kafka.listTopics(function (allist) {
//             kafka.listTopicPartitions(broid, allist, function (err, topiclistdetail) {
//                 jmxutil.getcombinedMetrics(BrokerList, function (err, combinedMetrics) {
//                     res.render('brokerInfo', {
//                         clustername: clustername,
//                         brokerlistId: broid,
//                         brokerMetric: metrics,
//                         topiclistdetail: topiclistdetail,
//                         InOutMessage: combinedMetrics
//                     })
//                 });
//             })
//         })
//     })
// });

/*Broker 详细页面 async方法*/
router.get('/clusters/:clustername/brokers/:brokerlistId', function (req, res, next) {
    var clustername = req.params.clustername;
    var brokerlistId = req.params.brokerlistId;
    var broid = BrokerList[brokerlistId - 1][0] + 1;
    var host = BrokerList[brokerlistId - 1][1];
    var port = BrokerList[brokerlistId - 1][3];

    async.parallel([
            function (cb) {
                jmxutil.getcombinedMetrics(BrokerList, cb) //calback(combinedMetrics)
            },
            function (cb) {
                jmxutil.connecthost(host, port, cb);// callback(metrics)
            },
            function (cb) {
                kafka.listTopics(function (allist) {
                    kafka.listTopicPartitions(broid, allist, cb)// callback(topiclistdetail)
                })
            }
        ],
        function (err, results) {
            res.render('brokerInfo', {
                clustername: clustername,
                brokerlistId: broid,
                brokerMetric: results[1],
                topiclistdetail: results[2],
                InOutMessage: results[0]
            })
        });
});


/* Consumers List 页面 */
router.get('/clusters/:clustername/consumers', function (req, res) {
    var clustername = req.params.clustername;
    zkutil.getAllConsumeInfo(function (allconsumeInfo) {//console.log(allconsumeInfo)
        res.render('consumerlist', {clustername: clustername, allconsumeInfo: allconsumeInfo})
    })
});


/* Consumed Topic Information 页面 */
router.get('/clusters/:clustername/consumers/:consumergp/type/ZK', function (req, res) {
    var clustername = req.params.clustername;
    var consumergp = req.params.consumergp;
    res.render('consumedTopicInfo', {clustername: clustername, consumergp: consumergp})
});


/* Topics it consumes from 链接页面 */
router.get('/clusters/:clustername/consumers/:consumergp/topic/:consumerTopic/type/ZK', function (req, res) {
    var clustername = req.params.clustername;
    var consumergp = req.params.consumergp;
    var consumerTopic = req.params.consumerTopic;
    var allInfo = [];
    nodeutils.getPartitionOffset(consumerTopic, function (Partition_LogSize) {
        // console.log("############" + Partition_LogSize);
        zkutil.getConsumerOffset(consumergp, consumerTopic, function (ConsumerOffset) {
            // console.log("############" + ConsumerOffset);
            zkutil.getInstanceOwner(consumergp, consumerTopic, function (InstanceOwner) {
                // console.log("############" + InstanceOwner);
                var instancenum = 0;
                for (var i = 0; i < Partition_LogSize.length; i++) { //i代表partition
                    var rowInfo = [];
                    var totalLag = 0;
                    rowInfo[0] = i;
                    rowInfo[1] = Partition_LogSize[i];
                    rowInfo[2] = (ConsumerOffset[i] == undefined) ? 0 : ConsumerOffset[i];
                    rowInfo[3] = rowInfo[1] - rowInfo[2];
                    totalLag += rowInfo[3];
                    if (InstanceOwner[i] == undefined) {
                        rowInfo[4] = "None";
                    } else {
                        rowInfo[4] = InstanceOwner[i];
                        instancenum++;
                    }
                    allInfo[i] = rowInfo;
                }//console.log(allInfo)
                var percentage = 100 * (instancenum / Partition_LogSize.length).toFixed(2)
                res.render('consumer_topic', {
                    clustername: clustername,
                    consumergp: consumergp,
                    consumerTopic: consumerTopic,
                    totalLag: totalLag,
                    percentage: percentage,
                    allInfo: allInfo
                })
            });
        });
    });
});


module.exports = router;
