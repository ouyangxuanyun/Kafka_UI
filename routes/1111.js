// function a (callback) {
//   var a = 'aaa'
//   console.log('running a, aaa')
//   callback(a);
//   //return a
//
// }
//
// a(function (a) {
//   console.log(a)
//   console.log("**************")
// })

{
    "name":"kafka2pg",
    "configs":{},
    "partitions":
    [{
        "partition": 2,
        "leader": 2,
        "replicas": [{"broker": 2, "leader": true, "in_sync": true}, {"broker": 3, "leader": false, "in_sync": true}]
    }, {
        "partition": 1,
        "leader": 1,
        "replicas": [{"broker": 1, "leader": true, "in_sync": true}, {"broker": 2, "leader": false, "in_sync": true}]
    }, {
        "partition": 0,
        "leader": 4,
        "replicas": [{"broker": 4, "leader": true, "in_sync": true}, {"broker": 1, "leader": false, "in_sync": true}]
    }]

