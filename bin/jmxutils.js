"use strict";
var jmx = require("jmx");
var jmxutil = new Object();


/**
 * @param host
 * @param port
 * @param callback 返回Metrics， 一个二维数组，Metrics[0-5]是以下获取的6个信息，每个信息包含Mean, 1min,5min,15min 4个信息
 * 连接一个broker， 获取这个broker上的MessagesIn，BytesIn，BytesOut，BytesReject，FailFech，FailProduce 6个信息
 */
function connecthost(host, port, callback) {
    var Metrics = [];
    var flag = 0;
    var client = jmx.createClient({
        host: host,
        port: port
    });
    client.connect();
    client.on("connect", function () {
        console.log("connect successful !")
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec", function (data) {
            // console.log("MessagesInPerSec" + data)
            Metrics[0] = data; //MessagesIn
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec", function (data) {
            // console.log("BytesInPerSec" + data)
            Metrics[1] = data; //BytesIn
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=BytesOutPerSec", function (data) {
            // console.log("BytesOutPerSec" + data)
            Metrics[2] = data; //BytesOut
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=BytesRejectedPerSec", function (data) {
            // console.log("BytesRejectedPerSec" + data)
            Metrics[3] = data;//BytesReject
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=FailedFetchRequestsPerSec", function (data) {
            // console.log("FailedFetchRequestsPerSec" + data)
            Metrics[4] = data;//FailFech
            flag++;
            if (flag === 6) callback(Metrics)
        });
        getmetricrow("kafka.server:type=BrokerTopicMetrics,name=FailedProduceRequestsPerSec", function (data) {
            // console.log("FailedProduceRequestsPerSec" + data)
            Metrics[5] = data;//FailProduce
            flag++;
            if (flag === 6) callback(Metrics)
        });


        /**
         * 得到一行的信息包括： MeanRate,OneMinuteRate,FiveMinuteRate,FifteenMinuteRate,
         */
        function getmetricrow(MBeanname, callback) {
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
// getcombinedMetrics(BrokerList, function (data) {
//     console.log("%%%%%%%%  " + data[0])
// });

/**
 *
 * @param BrokerList 传入所有的broker
 * @param callback 得到各个broker 6行信息（每行4个）的均值，作为combinedMetric返回
 *
 */
function getcombinedMetrics(BrokerList, callback) {
    var result = [];
    var combinedMetric = new Array();
    var flag = 0;
    for (var i = 0; i < BrokerList.length; i++) {
        !function (i) {
            connecthost(BrokerList[i][1], BrokerList[i][2], function (oneHostMetric) { // data是一个二维数组，[MessagesIn,BytesIn,BytesOut…]
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
                    callback(combinedMetric);
                }
            })
        }(i);
    }
}

jmxutil.connecthost = connecthost;
jmxutil.getcombinedMetrics = getcombinedMetrics;
module.exports = jmxutil;



