var attsjson = {
    name: 'test',
    zkHosts: 'VM-01:2181,VM-02:2181,VM-03:2181,VM-04:2181',
    kafkaVersion: '0.9.0.1',
    jmxEnabled: 'true',
    jmxUser: '',
    jmxPass: '',
    logkafkaEnabled: 'true',
    pollConsumers: 'true',
    filterConsumers: 'true',
    displaySizeEnabled: 'true',
    'tuning.brokerViewUpdatePeriodSeconds': '30',
    'tuning.clusterManagerThreadPoolSize': '2',
    'tuning.clusterManagerThreadPoolQueueSize': '100',
    'tuning.kafkaCommandThreadPoolSize': '2',
    'tuning.kafkaCommandThreadPoolQueueSize': '100',
    'tuning.logkafkaCommandThreadPoolSize': '2',
    'tuning.logkafkaCommandThreadPoolQueueSize': '100',
    'tuning.logkafkaUpdatePeriodSeconds': '30',
    'tuning.partitionOffsetCacheTimeoutSecs': '5',
    'tuning.brokerViewThreadPoolSize': '2',
    'tuning.brokerViewThreadPoolQueueSize': '1000',
    'tuning.offsetCacheThreadPoolSize': '2',
    'tuning.offsetCacheThreadPoolQueueSize': '1000',
    'tuning.kafkaAdminClientThreadPoolSize': '2',
    'tuning.kafkaAdminClientThreadPoolQueueSize': '1000'
}

function gettestInfo() {
    var attresult = [];
    attresult["clustername"] = 'test';
    attresult["zkHosts"] = 'VM-01:2181,VM-02:2181,VM-03:2181,VM-04:2181'; //因为zkHost里面有：，会影响下面继续以：为分隔符进行分割，先保存
    var attsstr = JSON.stringify(attsjson);//console.log(attsstr)
    var arr1 = attsstr.slice(1, -1).split(",");
    for (var i = 2; i < arr1.length; i++) {
        var temp = arr1[i].split(":");
        attresult[temp[0].slice(1, -1)] = temp[1].slice(1, -1)
    }
    return attresult;
}

module.exports = gettestInfo;


