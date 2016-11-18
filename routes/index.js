var express = require('express');
var router = express.Router();
var fs = require('fs');
var kafka = require('../bin/kafkautil');
var jmxutil = require('../bin/jmxutils');
var zkutil = require('../bin/zkutils');
var KafkaRest = require('kafka-rest');
var url = 'http://10.192.33.76:8082';
var kafka1 = new KafkaRest({'url': url});

var AllCluster = [];AllCluster.length = 0;  // 全局存储创建的cluster 信息



/* GET home page. */
router.get('/', function (req, res, next) {
    //var clusters = JSON.parse(fs.readFileSync('../test/clusters.json'))
    var clusters = JSON.parse(fs.readFileSync('./test/clusters.json'));
    res.render('index', {clusters: clusters});
});

router.get('/addCluster', function (req, res, next) {
    res.render('addcluster');
});

/**
 * 获取表单提交的数据处理后存入attresult 数组，详细见README/1.
 */
router.get('/clusters', function (req, res, next) {
    var attresult = [];
    var attsjson = req.query;
    console.log(attsjson);
    attresult["clustername"] = req.query.name;
    attresult["zkHosts"] = req.query.zkHosts; //因为zkHost里面有：，会影响下面继续以：为分隔符进行分割，先保存
    var attsstr = JSON.stringify(attsjson);//console.log(attsstr)
    var arr1 = attsstr.slice(1,-1).split(",");
    for (var i = 2; i < arr1.length; i++) {
        var temp = arr1[i].split(":");
        attresult[temp[0].slice(1,-1)] = temp[1].slice(1,-1)
    }
    console.log(attresult["clustername"]);
    AllCluster[attresult["clustername"]] = attresult;
    AllCluster.length++;
    console.log(attresult);
    console.log("LLLLLLLLLLLLLL:    " + AllCluster.length);
    res.render('addclusterresult')
});


router.get('/clusters/:clustername', function (req, res, next) {
    console.log("***************************************************" + req.params.clustername)
    console.log(AllCluster[ req.params.clustername]);
});


/* GET topic list page. */
router.get('/clusters/test/topics', function (req, res, next) {
    //var topics = JSON.parse(fs.readFileSync('./test/TopicList.json'));
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
                            res.render('topics', {topics: topic_list});
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
    console.log("00000000000000000%%%%%%%%%%%%%%%%%%")
    var topic_name = req.query.topic;
    var kafka2 = require('kafka-node'),
        Producer = kafka2.Producer,
        client = new kafka2.Client('10.192.33.57:2181,10.192.33.69:2181,10.192.33.76:2181'),
        producer = new Producer(client)
    producer.on('ready', function () {
        console.log("11111111%%%%%%%%%%%%%%%%%%%")
        producer.createTopics(topic_name, false, function (err, data) {
            console.log("222222%%%%%%%%%%%%%%%%%%%")
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


/**
 *
 */
var InOutMessage = [];
// var BrokerList = [
//     [1, "10.192.33.57", 9997],
//     [2, "10.192.33.26", 9998],
//     [3, "10.192.33.69", 9998],
//     [4, "10.192.33.76", 9998]
// ]

var BrokerList = "";
//router.get('/clusters/' + clustername + '/brokers', function (req, res, next) {
router.get('/clusters/:clustername/brokers', function (req, res, next) {
    var clustername = req.params.clustername;
    var brokers = JSON.parse(fs.readFileSync('./test/brokers.json'));

    zkutil.getBrokerList(function (_BrokerList) {
        BrokerList = _BrokerList;
        jmxutil.getcombinedMetrics(BrokerList, function (combinedMetrics) {
            InOutMessage = combinedMetrics;
            kafka.getbrokerlist(function (data) { //brokers是测试数据
                res.render('brokers', {
                    clustername: clustername,
                    brokers: brokers,
                    combinedMetrics: combinedMetrics,
                    BrokerList: BrokerList
                })
            });
        });
    });
});

/**
 *
 */

// 选择进入哪个broker 的页面,还用到了clustername，这个页面上两级的cluster的名字
//router.get('/clusters/' + clustername + '/brokers/*', function (req, res, next) {
router.get('/clusters/:clustername/brokers/:brokerlistId', function (req, res, next) {
    var clustername = req.params.clustername;//var pathurl = URL.parse(req.url).pathname;var brokerlistId = pathurl.substr(23);
    var brokerlistId = req.params.brokerlistId;
    console.log("###############################" + BrokerList);
    var broid = BrokerList[brokerlistId][0] + 1;
    var host = BrokerList[brokerlistId][1];
    var port = BrokerList[brokerlistId][3];
    var series = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    var labels = ['09', '10', '11']
    var dataIn = [labels, series]
    console.log(JSON.stringify(labels))

    jmxutil.connecthost(host, port, function (metrics) {
        kafka.listTopics(function (allist) {
            kafka.listTopicPartitions(broid, allist, function (topiclistdetail) {
                // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@")
                //console.log(topiclistdetail)
                res.render('brokerInfo', {
                    clustername: clustername,
                    brokerlistId: brokerlistId,
                    brokerMetric: metrics,
                    dataIn: dataIn,
                    topiclistdetail: topiclistdetail,
                    InOutMessage: InOutMessage
                })
            })
        })
    })
});

module.exports = router;
