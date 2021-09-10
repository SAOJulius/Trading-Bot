const Binance = require('node-binance-api')

class ApiClient {
    constructor() {
        this.name = 'Sdasd'
        this.client = new Binance().options({
            APIKEY: 'YIytFyvhOJ3N3I09gTtdu0gjt8u7dtSu3UsAw59Gfj68PdPfAUmIbWo7U44ahunp',
            APISECRET:
                'KYgckMDKoZ3StiOBZu6GrSt2FFiqUWB2wMNlR3iMDd31ZsprfJzgbimyZLV6vp49',
        })
    }
    displayCurrentPrices() {
        console.log(this.name)
        this.client.prices().then((res) => {
            console.log(res)
        })
    }
}

module.exports = ApiClient
