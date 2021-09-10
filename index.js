const Apiclient = require('./api/client.js')

const apiclient = new Apiclient()

setInterval(apiclient.displayCurrentPrices, 1000)
