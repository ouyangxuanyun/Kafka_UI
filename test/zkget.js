var zookeeper = require('node-zookeeper-client');

var client = zookeeper.createClient('10.192.33.57:2181,10.192.33.26:2181,10.192.33.69:2181,10.192.33.76:2181');
var path = "/brokers/ids";
client.connect();

client.getChildren(path, function (error, children, stats) {
    if (error) {
        console.log(error.stack);
        return;
    }
    console.log('Children are: %j.', children);
    console.log(children.length);
});