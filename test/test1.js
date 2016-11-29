var async = require('async')

// async.waterfall([
//     function(callback){
//         console.log("1")
//         callback(null, 'one', 'two');
//     },
//     function(arg1, arg2, callback){
//         console.log("2")
//         callback(null, 'three');
//     },
//     function(arg1, callback){
//         console.log("3")
//         // arg1 now equals 'three'
//         callback(null, 'done');
//     }
// ], function (err, result) {
//     console.log(result)
//     // result now equals 'done'
// });

// async.parallel([
//     function(callback) { callback(null,a())}, // 该函数的值不会传给最终callback，但要占个位置
//     function(callback) { b(callback) }
// ],function(err, results) {
//     console.log( results);
// });


function a(callback) {
    var a = [1,2,3,4,5];
    // console.log("aaa")
    // callback(null,aa);
    callback(null,a);
}

function b(callback) {
    var b = [10,20,30,40,50];
    console.log("bbb")
    callback(b);
}

a(function (err,data) {
    console.log("###########" + data)
})
