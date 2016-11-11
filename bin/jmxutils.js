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
    var Metrics = [],flag = 0;
    var client = jmx.createClient({
        host: host,
        port: port
    });
    client.connect();
    client.on("connect", function () {
        console.log("connect successful !");
        var Items = ["MessagesInPerSec","BytesInPerSec","BytesOutPerSec",
            "BytesRejectedPerSec","FailedFetchRequestsPerSec","FailedProduceRequestsPerSec"];// 需要计算的属性值
        for (var i = 0; i < 6; i++) {
            !function (i) {
                getmetricrow(client,"kafka.server:type=BrokerTopicMetrics,name=" + Items[i], function (data) {
                    // console.log("MessagesInPerSec" + data)
                    Metrics[i] = data; //MessagesIn
                    flag++;
                    if (flag === 6) callback(Metrics)
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
 *
 */
function getcombinedMetrics(BrokerList, callback) {
    var result = [];
    var combinedMetric = new Array();
    var flag = 0;
    for (var i = 0; i < BrokerList.length; i++) {
        !function (i) {
            connecthost(BrokerList[i][1], BrokerList[i][3], function (oneHostMetric) { // data是一个二维数组，[MessagesIn,BytesIn,BytesOut…]
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



