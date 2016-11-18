var express = require('express');
var router = express.Router();
var fs = require('fs');
var kafka = require('../bin/kafkautil');
var jmxutil = require('../bin/jmxutils');
var zkutil = require('../bin/zkutils');
var KafkaRest = require('kafka-rest');
var url = 'http://10.192.33.76:8082';
var kafka1 = new KafkaRest({'url': url});
var kafka2connstr = '10.192.33.57:2181,10.192.33.69:2181,10.192.33.76:2181';

var testInfo = require('../test/gettestInfo')
var AllCluster = [];
AllCluster.length = 1;  // 全局存储创建的cluster 信息
AllCluster["test"] = testInfo();// console.log(AllCluster["test"])

/*显示clusters list 信息， homepage页*/
router.get('/', function (req, res, next) {
    var clusters = [];
    for (var key in AllCluster) {
        var cluster = new Object();
        cluster.name = key;
        cluster.kafkaVersion = AllCluster[key]["kafkaVersion"];
        cluster.zkHosts = AllCluster[key]["zkHosts"];
        cluster.operation = "Disable";
        clusters.push(cluster);// console.log(cluster.name,cluster.kafkaVersion,cluster.zkHosts,cluster.operation);
    }
    res.render('clusters', {clusters: clusters});
});

/* 添加cluster页面*/
router.get('/addCluster', function (req, res, next) {
    res.render('addcluster');
});

/*Cluster Modify 页面 */
router.get('/updateCluster', function (req, res, next) {
    res.render('updateCluster');
});



/* 获取表单提交的数据处理后存入attresult 数组，详细见README/1.*/
router.get('/clusters', function (req, res, next) {
    var attresult = [];
    var attsjson = req.query;// console.log(attsjson);
    var clustername = req.query.name
    attresult["clustername"] = clustername;
    attresult["zkHosts"] = req.query.zkHosts; //因为zkHost里面有：，会影响下面继续以：为分隔符进行分割，先保存
    var attsstr = JSON.stringify(attsjson);//console.log(attsstr)
    var arrs = attsstr.slice(1, -1).split(",");
    for (var i = 2; i < arrs.length; i++) {
        var temp = arrs[i].split(":");
        attresult[temp[0].slice(1, -1)] = temp[1].slice(1, -1)
    }
    AllCluster[attresult["clustername"]] = attresult;
    AllCluster.length++;
    res.render('addclusterresult', {clustername: clustername})
});

/*每个cluster详情页*/
router.get('/clusters/:clustername', function (req, res, next) {
    //console.log(AllCluster[req.params.clustername]);
    var clusterInfoname = req.params.clustername;
    zkutil.getbrokernumbers(function (bronum) {
        kafka.getlistlen(function (listlen) {
            res.render('clusterInfo', {
                clusterInfoname: clusterInfoname,
                listlen: listlen,
                bronum: bronum,
                clusterInfoname: clusterInfoname,
                clusterInfo: AllCluster[clusterInfoname]
            });
        });
    })
});


/* GET topic list page. */
router.get('/clusters/:clustername/topics', function (req, res, next) {
    //var topics = JSON.parse(fs.readFileSync('./test/TopicList.json'));
    var clustername = req.params.clustername;
    var topic_count = 0;
    var topic_list = [];
    var broker_list = 0;

    kafka1.topics.list(function (err, data) {
        if (err) {
            console.log('Failed to list topics: ' + err);
            res.render('topics', err);
        }
        else {
            kafka1.brokers.list(function (err, b_data) {
                if (err) {
                    console.log('Failed to get brokers list :' + err);
                    res.render('topics', err);
                }
                else {
                    //console.log('Getting brokers list: \n' + data);
                    broker_list = b_data;
                }
            });
            for (var i = 0; i < data.length; i++) {
                //console.log(data[i].name);
                kafka1.topics.get(data[i].name, function (err, datas) {
                    if (err) {
                        console.log('Failed to get topic info of ' + data[i].name + ': ' + err);
                        res.render('topics', err);
                    }
                    else {
                        console.log('==================\n');
                        console.log(datas.raw.partitions[0]);
                        datas.brokers = broker_list;
                        topic_list.push(datas);
                        topic_count++;
                        //console.log(topic_list);
                        if (topic_count == data.length) {
                            res.render('topics', {clustername: clustername, topics: topic_list});
                            console.log(topic_list);
                        }
                    }
                })
            }
        }
    });
    //res.render('topics', JSON.parse(topics));
});

/* GET each topic details . */
router.get('/clusters/test/topics/:topic', function (req, res, next) {
    var topics_name = req.params.topic;
    console.log(req.param.topic);
    kafka1.topics.get(topics_name, function (err, datas) {
        if (err) {
            console.log('Failed to list topics: ' + err);
            res.render('topicdetail', err);
        }
        else {
            var topicdetail = datas;
            topicdetail['topicname'] = topics_name;
            kafka1.brokers.list(function (err, data) {
                if (err) {
                    console.log('Failed to get brokers list :' + err);
                    res.render('topicdetail', err);
                }
                else {
                    //console.log('Getting brokers list: \n' + data);
                    topicdetail['brokers'] = data;
                    res.render('topicdetail', {topicdetail: topicdetail});
                    //console.log(topicdetail.raw.partitions)
                }
            });
        }
    });
});

/* topic create result page. */
router.get('/clusters/test/createTopic', function (req, res, next) {
    res.render('createtopic');
});

/* topic create result page. */
router.get('/clusters/test/createResult', function (req, res, next) {
    var topic_name = req.query.topic;
    var kafka2 = require('kafka-node'),
        Producer = kafka2.Producer,
        client = new kafka2.Client(kafka2connstr);
        producer = new Producer(client)
    producer.on('ready', function () {
        producer.createTopics(topic_name, false, function (err, data) {
            if (err) {
                console.log('Error: While writing message to Kafka', err)
                res.render('createtopicresult', err);
            }
            else {
                console.log('create topic  ' + topic_name + 'successfully!');
                res.render('createtopicresult', {topic_name: topic_name});
            }
        })
    })
});


/* Broker list 页面*/
var InOutMessage = []; //全局，也提供给broker详细页面
var BrokerList = ""; //全局，也提供给broker详细页面
router.get('/clusters/:clustername/brokers', function (req, res, next) {
    var clustername = req.params.clustername;
    zkutil.getBrokerList(function (_BrokerList) {
        BrokerList = _BrokerList;
        jmxutil.getcombinedMetrics(BrokerList, function (combinedMetrics) {
            InOutMessage = combinedMetrics;
            res.render('brokers', {
                clustername: clustername,
                combinedMetrics: combinedMetrics,
                BrokerList: BrokerList
            })
        });
    });
});

/*Broker 详细页面 */
router.get('/clusters/:clustername/brokers/:brokerlistId', function (req, res, next) {
    var clustername = req.params.clustername;
    var brokerlistId = req.params.brokerlistId;
    var broid = BrokerList[brokerlistId - 1][0] + 1;
    var host = BrokerList[brokerlistId - 1][1];
    var port = BrokerList[brokerlistId - 1][3];

    jmxutil.connecthost(host, port, function (metrics) {
        kafka.listTopics(function (allist) {
            kafka.listTopicPartitions(broid, allist, function (topiclistdetail) {
                res.render('brokerInfo', {
                    clustername: clustername,
                    brokerlistId: broid,
                    brokerMetric: metrics,
                    topiclistdetail: topiclistdetail,
                    InOutMessage: InOutMessage
                })
            })
        })
    })
});

module.exports = router;
