var express = require('express')
var router = express.Router()
var fs = require('fs')
var kafka = require('../bin/kafkautil')

/* GET home page. */
router.get('/', function (req, res, next) {
    // ubuntu webstome use "./test/...", centos stand alone use "../test..."
    //var clusters = JSON.parse(fs.readFileSync('../test/clusters.json'))
    var clusters = JSON.parse(fs.readFileSync('./test/clusters.json'))
    res.render('index', {clusters: clusters})
})

router.get('/brokers', function (req, res, next) {

    var brokers = JSON.parse(fs.readFileSync('./test/brokers.json'))
    kafka.getbrokerlist(function (data) {
        res.render('brokers_test', {brokers: brokers, brokerid: data})
    });
    //res.render('brokers_test', {brokers: brokers,brokerid:brokerid})
})

// router.get('/brokerInfo', function (req, res, next) {
//     var brokerInfo = JSON.parse(fs.readFileSync('./test/brokerInfo.json'))
//     var brokerMetric = JSON.parse(fs.readFileSync('./test/brokerMetric.json'))
//     var topicInfo = JSON.parse(fs.readFileSync('./test/topic.json'))
//     // var labels = ['09:21:58', '09:22:28', '09:22:58', '09:23:28', '09:23:58', '09:24:28', '09:24:58', '09:25:28', '09:25:58', '09:26:28']
//     var labels = ['09:21:58', '09:22:28', '09:22:58', '09:23:28', '09:23:58', '09:24:28', '09:24:58', '09:25:28', '09:25:58', '09:26:28']
//     var series = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
//     var dataIn = [labels, series]
//     res.render('brokerInfo_test', {
//         brokerInfo: brokerInfo,
//         brokerMetric: brokerMetric,
//         topicInfo: topicInfo,
//         dataIn: dataIn
//     })
// })

router.get('/brokerInfo', function (req, res, next) {
    var brokerInfo = JSON.parse(fs.readFileSync('./test/brokerInfo.json'))
    var brokerMetric = JSON.parse(fs.readFileSync('./test/brokerMetric.json'))
    var topicInfo = JSON.parse(fs.readFileSync('./test/topic.json'))
    // var labels = ['09:21:58', '09:22:28', '09:22:58', '09:23:28', '09:23:58', '09:24:28', '09:24:58', '09:25:28', '09:25:58', '09:26:28']
    var labels = ['09:21:58', '09:22:28', '09:22:58', '09:23:28', '09:23:58', '09:24:28', '09:24:58', '09:25:28', '09:25:58', '09:26:28']
    var series = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    var dataIn = [labels, series]

    kafka.listTopics(kafka.listTopicPartitions(data,function() {
        res.render('brokerInfo_test', {
            brokerInfo: brokerInfo,
            brokerMetric: brokerMetric,
            topicInfo: topicInfo,
            dataIn: dataIn
        })
    }));



})


module.exports = router
