var attsjson = {
    name: 'test1',
    zkHosts: 'VM-01:2181,VM-02:2181',
    kafkaVersion: '0.9.0.1',
    jmxEnabled: 'false',
    jmxUser: '',
    jmxPass: '',
    logkafkaEnabled: 'false',
    pollConsumers: 'true',
    filterConsumers: 'true',
    activeOffsetCacheEnabled:'true',
    displaySizeEnabled: 'true',
    'tuning.brokerViewUpdatePeriodSeconds': '930', // 10,1000
    'tuning.clusterManagerThreadPoolSize': '92',//2,1000
    'tuning.clusterManagerThreadPoolQueueSize': '9100',//10,1000
    'tuning.kafkaCommandThreadPoolSize': '92',//2,1000
    'tuning.kafkaCommandThreadPoolQueueSize': '9100',//10,1000
    'tuning.logkafkaCommandThreadPoolSize': '92',//2,1000
    'tuning.logkafkaCommandThreadPoolQueueSize': '9100',//10,1000
    'tuning.logkafkaUpdatePeriodSeconds': '930',//10,1000
    'tuning.partitionOffsetCacheTimeoutSecs': '95',//5,1000
    'tuning.brokerViewThreadPoolSize': '92',//2,1000
    'tuning.brokerViewThreadPoolQueueSize': '91000',//10,1000
    'tuning.offsetCacheThreadPoolSize': '92',//2,100//10,1000
    'tuning.offsetCacheThreadPoolQueueSize': '91000',//10,1000
    'tuning.kafkaAdminClientThreadPoolSize': '92',//2,1000
    'tuning.kafkaAdminClientThreadPoolQueueSize': '91000'//10,1000
}

function gettestInfo() {
    var attresult = [];
    attresult["clustername"] = 'test1';
    attresult["zkHosts"] = attsjson.zkHosts; //因为zkHost里面有：，会影响下面继续以：为分隔符进行分割，先保存
    var attsstr = JSON.stringify(attsjson);//console.log(attsstr)
    var arr1 = attsstr.slice(1, -1).split(",");
    for (var i = 2; i < arr1.length; i++) {
        var temp = arr1[i].split(":");
        attresult[temp[0].slice(1, -1)] = temp[1].slice(1, -1)
    }
    return attresult;
}

module.exports = gettestInfo;


