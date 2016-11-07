"use strict";
var jmx = require("jmx");
var jmxutil = new Object();

var Metricsneed = ["BytesInPerSec", "BytesOutPerSec", "BytesRejectedPerSec", "FailedFetchRequestsPerSec",
    "FailedProduceRequestsPerSec", "MessagesInPerSec"]

function connecthost(host, port,callback) {
    var Metrics = [];
    var flag = 0;
    var client = jmx.createClient({
        host: host,
        port: port
    });
    client.connect();
    client.on("connect", function () {
        console.log("connect successful !")
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec",function (data) {
            // console.log("MessagesInPerSec" + data)
            Metrics[0] = data; //MessagesIn
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec",function (data) {
            // console.log("BytesInPerSec" + data)
            Metrics[1] = data; //BytesIn
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=BytesOutPerSec",function (data) {
            // console.log("BytesOutPerSec" + data)
            Metrics[2] = data; //BytesOut
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=BytesRejectedPerSec",function (data) {
            // console.log("BytesRejectedPerSec" + data)
            Metrics[3] = data;//BytesReject
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=FailedFetchRequestsPerSec",function (data) {
            // console.log("FailedFetchRequestsPerSec" + data)
            Metrics[4] = data;//FailFech
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=FailedProduceRequestsPerSec",function (data) {
            // console.log("FailedProduceRequestsPerSec" + data)
            Metrics[5] = data;//FailProduce
            flag++;
            if (flag === 6) callback(Metrics)
        });


        //get MeanRate,OneMinuteRate,FiveMinuteRate,FifteenMinuteRate,
        function getmetricrow(MBeanname,callback) {
            var result = [];
            var i = 0;
            client.getAttribute(MBeanname, "MeanRate", function (data) {
                // console.log(data.toString());
                result[0] = data;
                i++
                // console.log(i)
                if (i == 4) callback(result);
            });
            client.getAttribute(MBeanname, "OneMinuteRate", function (data) {
                // console.log(data.toString());
                result[1] = data;
                i++
                // console.log(i)
                if (i == 4) callback(result);
            });
            client.getAttribute(MBeanname, "FiveMinuteRate", function (data) {
                // console.log(data.toString());
                result[2] = data;
                i++
                // console.log(i)
                if (i == 4) callback(result);
            });
            client.getAttribute(MBeanname, "FifteenMinuteRate", function (data) {
                // console.log(data.toString());
                result[3] = data;
                i++
                // console.log(i)
                if (i == 4) callback(result);
            });
        }

    });
}

// connecthost("10.192.33.69", 9998, function (data) {
//     console.log("***************" + data[5])
// })

var BrokerList = [
    [1,"10.192.33.57",9997],
    [1,"10.192.33.26",9998],
    [1,"10.192.33.69",9998],
    [1,"10.192.33.76",9998]
]

function getcombinedMetrics(BrokerList,callback) {
    var result = [];
    var combinedMetric = new Array(new Array());
    var flag = 0;
    for (var i = 0; i < BrokerList.length;i++) {
        connecthost(BrokerList[i][1],BrokerList[i][2],function (oneHostMetric) { // data是一个二维数组，[MessagesIn,BytesIn,BytesOut…]
            result[i] = oneHostMetric;
            flag++;
        })
    }

    if (flag == BrokerList.length) {
        for (var m = 0; m < 6; m ++) {
            for (var n = 0; n <4; n++) {
                for (var j = 0; j < result.length; j++) {
                    var temp = 0;
                    temp  += result[j][m][n];
                }
                combinedMetric[m][n] = temp / result.length;
            }
        }
    }
    if (combinedMetric.length == 6 &&combinedMetric[5].length == 4) {
        callback(combinedMetric);
    }
}



jmxutil.connecthost =connecthost;
module.exports = jmxutil;



