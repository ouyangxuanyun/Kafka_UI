var express = require('express')
var router = express.Router()
var fs = require('fs')
var kafka = require('../bin/kafkautil')

/* GET home page. */
router.get('/', function (req, res, next) {
    //var clusters = JSON.parse(fs.readFileSync('../test/clusters.json'))
    var clusters = JSON.parse(fs.readFileSync('./test/clusters.json'))
    res.render('index', {clusters: clusters})
})

router.get('/brokers', function (req, res, next) {
    var brokers = JSON.parse(fs.readFileSync('./test/brokers.json'))
    kafka.getbrokerlist(function (data) {
        res.render('brokers_test', {brokers: brokers, brokerid: data})
    });
})

router.get('/brokerInfo', function (req, res, next) {
    var broid = 1; //?????????
    var brokerInfo = JSON.parse(fs.readFileSync('./test/brokerInfo.json'))
    var brokerMetric = JSON.parse(fs.readFileSync('./test/brokerMetric.json'))
    // var labels = ['09:21:58', '09:22:28', '09:22:58', '09:23:28', '09:23:58', '09:24:28', '09:24:58', '09:25:28', '09:25:58', '09:26:28']
    //var labels = '["09:21:58", "09:22:28", "09:22:58", "09:23:28", "09:23:58", "09:24:28", "09:24:58", "09:25:28", "09:25:58", "09:26:28"]'
    var series = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    var labels = ['09', '10', '11']
    var dataIn = [labels, series]
    console.log(JSON.stringify(labels))

    kafka.listTopics(function (allist) {
        kafka.listTopicPartitions(broid, allist, function (topiclistdetail) {
            // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@")
            // console.log(_topiclistdetail)
            res.render('brokerInfo_test', {
                brokerInfo: brokerInfo,
                brokerMetric: brokerMetric,
                dataIn: dataIn,
                topiclistdetail: topiclistdetail
            })
        })
    })
})


module.exports = router
