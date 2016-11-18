// var t1 = {
//     name: 'dd',
//     'jmxUser.com': 'd'
// }
// console.log(t1)
// var t2 = JSON.stringify(t1);
// console.log(t2)
// var arr1 = t2.slice(1,-1).split(",")
// var arr2 = arr1[0].split(":")
// console.log(t1.name)
// console.log(arr2[1].slice(1,-1) )
//
// var a3 = [];
// a3[aaa] = 1;
// console.log(a3[aaa])

var rrr = { name: '555555',
    zkHosts: 'VM-01:2181 VM-02:2181 VM-03:2181 VM-04:2181',
    kafkaVersion: '0.9.0.1',
    jmxUser: '',
    jmxPass: '',
    'tuning.brokerViewUpdatePeriodSeconds': '30',
    'tuning.clusterManagerThreadPoolSize': '2',
    'tuning.clusterManagerThreadPoolQueueSize': '100',
    'tuning.kafkaCommandThreadPoolSize': '2',
    'tuning.kafkaCommandThreadPoolQueueSize': '100',
    'tuning.logkafkaCommandThreadPoolSize': '2',
    'tuning.logkafkaCommandThreadPoolQueueSize': '100',
    'tuning.logkafkaUpdatePeriodSeconds': '30',
    'tuning.partitionOffsetCacheTimeoutSecs': '5',
    'tuning.brokerViewThreadPoolSize': '1',
    'tuning.brokerViewThreadPoolQueueSize': '1000',
    'tuning.offsetCacheThreadPoolSize': '1',
    'tuning.offsetCacheThreadPoolQueueSize': '1000',
    'tuning.kafkaAdminClientThreadPoolSize': '1',
    'tuning.kafkaAdminClientThreadPoolQueueSize': '1000' };

    var result = [];
var t2 = JSON.stringify(rrr);
console.log(t2)
var arr1 = t2.slice(1,-1).split(",")
for (var i = 5; i < arr1.length; i++) {
    var temp = arr1[i].split(":")
    console.log(temp)
    result[temp[0].slice(1,-1)] = temp[1].slice(1,-1)
}

console.log(result["tuning.brokerViewUpdatePeriodSeconds"])
// var arr2 = arr1[0].split(":")
// console.log(t1.name)
// console.log(arr2[1].slice(1,-1) )


