var fs = require('fs')

var brokers = JSON.parse(fs.readFileSync('./brokers.json'))
console.log(brokers[0].b[0])
