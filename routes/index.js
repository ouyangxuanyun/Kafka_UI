var express = require('express')
var router = express.Router()
var fs = require('fs')

/* GET home page. */
router.get('/', function (req, res, next) {
  // ubuntu webstome use "./test/...", centos stand alone use "../test..."
  //var clusters = JSON.parse(fs.readFileSync('../test/clusters.json'))
  var clusters = JSON.parse(fs.readFileSync('./test/clusters.json'))
  res.render('index', {clusters: clusters})
})

router.get('/brokers', function (req, res, next) {
  // ubuntu webstome use "./test/...", centos stand alone use "../test..."
  //var clusters = JSON.parse(fs.readFileSync('../test/clusters.json'))
  var brokers = JSON.parse(fs.readFileSync('./test/brokers.json'))
  console.log(brokers.BrokersList)
  res.render('brokers_test', {brokers: brokers})
})
module.exports = router
