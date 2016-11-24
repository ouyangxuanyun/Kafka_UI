"use strict";
var zookeeper = require('node-zookeeper-client');
var zkconnstr = '10.192.33.57:2181,10.192.33.26:2181,10.192.33.69:2181,10.192.33.76:2181';
var client = zookeeper.createClient(zkconnstr);
client.connect();
var zkutils = new Object();
var BrokerList = [];

/**
 * @param callback
 * 首先client.getChildren获取Broker总数，遍历每个broker并获取其Host,Port,JMX Port,Time, Version信息，返回二维数组[[brokerinfo],[brokerinfo]，……]
 */
function getBrokerList(callback) {
    client.getChildren("/brokers/ids", function (error, children, stats) {
        if (error) {
            console.log(error.stack);
            return;
        }//console.log('Children are: %j.', children);console.log(children.length);
        var brokernum = children.length, flag = 0;
        for (var brokerid = 0; brokerid < brokernum; brokerid++) {
            !function (brokerid) {
                getbrokerinfo(brokerid + 1, function (data) {
                    console.log(data);
                    BrokerList[brokerid] = new Array();
                    BrokerList[brokerid][0] = brokerid;
                    BrokerList[brokerid][1] = data.host;
                    BrokerList[brokerid][2] = data.port;
                    BrokerList[brokerid][3] = data.jmx_port;
                    BrokerList[brokerid][4] = timeStamp2String(data.timestamp);
                    BrokerList[brokerid][5] = data.version;
                    flag++;
                    if (flag == brokernum) callback(BrokerList);
                })
            }(brokerid);
        }

    });
}

/**
 * @param time
 * @returns {string}
 * 辅助函数 时间戳->指定格式的时间
 */
function timeStamp2String(time) {
    var datetime = new Date();
    datetime.setTime(time);
    var year = datetime.getFullYear();
    var month = datetime.getMonth() + 1;
    var date = datetime.getDate();
    var hour = datetime.getHours();
    var minute = datetime.getMinutes();
    var second = datetime.getSeconds();
    return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;
};

/**
 *
 * @param brokerid
 * @param callback
 * 得到某个broker的 Host,Port, JMX_Port， timestamp, Version等信息
 */
function getbrokerinfo(brokerid, callback) {
    var path = "/brokers/ids/" + brokerid;
    client.exists(path, function (error, stat) {
        if (error) {
            console.log(error.stack);
            return;
        }
        if (stat) {// console.log(brokerid + ' Node exists.');
            client.getData(path,//function (event) {console.log('Got event: %s.', event);},
                function (error, data, stat) {
                    if (error) {
                        return console.log(error.stack);
                    } else {
                        callback(JSON.parse(data.toString('utf8'))) //data buffer -> String -> Object
                    }//console.log('Got data: %s', data.toString('utf8'));
                }
            );
        } else {//console.log('Node does not exist.');
            callback(0);
        }
    });
}

function getbrokernumbers(callback) {
    client.getChildren("/brokers/ids", function (error, children, stats) {
        if (error) {
            console.log(error.stack);
            return;
        }
        callback(children.length);
    });
}


function getconsumerList(callback) {
    client.getChildren("/consumers", function (error, children, stats) {
        if (error) {
            console.log(error.stack);
            return;
        }
        callback(children);//返回consumers数组
    });
}


function getEachConsumeTopics(consumergp, callback) {
    var offsetpath = "/consumers/" + consumergp + "/offsets";
    var ownerspath = "/consumers/" + consumergp + "/owners";

    var consumtopics = [];
    client.exists(offsetpath, function (error, stat) {
        if (error) {
            return console.log("err1" + error.stack);
        }
        if (stat) {//console.log("offoffoffoffoff")
            client.getChildren(offsetpath, function (error, children) {
                if (error) {
                    return console.log("err2" + error.stack);
                }
                consumtopics = children;
                callback(consumtopics);
            });
        } else {
            client.exists(ownerspath, function (error, stat) {
                if (error) {
                    return console.log("err3" + error.stack);
                }
                if (stat) {//console.log("owneowneowneowneowne")
                    client.getChildren(ownerspath, function (error, children) {
                        if (error) {
                            return console.log("err4" + error.stack);
                        }
                        consumtopics = children;
                        callback(consumtopics);
                    });
                } else {
                    consumtopics = [];
                    callback(consumtopics);
                }
            });
        }
    });

}


function getAllConsumeInfo(callback) {
    var allconsumersInfo = [];
    var num = 1;
    getconsumerList(function (consumers) {
        for (var i = 0; i < consumers.length; i++) {
            !function (i) {
                var entryInfo = [];
                entryInfo[0] = consumers[i];
                entryInfo[1] = "ZK";
                getEachConsumeTopics(consumers[i], function (consumtopics) {
                    entryInfo[2] = consumtopics;
                    allconsumersInfo.push(entryInfo);
                    if (num++ == consumers.length) {
                        callback(allconsumersInfo);
                    }
                });
            }(i);
        }
    });
}


zkutils.getbrokerinfo = getbrokerinfo;
zkutils.getBrokerList = getBrokerList;
zkutils.getbrokernumbers = getbrokernumbers;
zkutils.getAllConsumeInfo = getAllConsumeInfo;
module.exports = zkutils;