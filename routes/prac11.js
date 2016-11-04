var jmx = require("jmx");

client = jmx.createClient({
    host: "10.192.33.69", // optional
    port: 9998
});

client.connect();
client.on("connect", function() {
    console.log("connect successful !")
    // client.getAttribute("java.lang:type=Memory", "HeapMemoryUsage", function(data) {
    //     var used = data.getSync('used');
    //     console.log("HeapMemoryUsage used: " + used.longValue);
    //     // console.log(data.toString());
    // });
    //
    // client.getAttribute("kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec,topic=logstash", "EventType", function(data) {
    //     console.log(data.toString());
    // });
    //
    // client.getAttribute("kafka.server:type=BrokerTopicMetrics,name=BytesInPerSec,topic=logstash,partition=0", "MeanRate", function(data) {
    //     console.log(data.toString());
    // });
    var MBeanname = "kafka.server:type=BrokerTopicMetrics,name=BytesOutPerSec,topic=test_jnn"
    var Attribute = "MeanRate"
    client.getAttribute(MBeanname,Attribute, function(data) {
        console.log(data.toString());
    });


});
client.disconnect();