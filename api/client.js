import axios from 'axios'

export default class ApiClient {
    displayCurrentPrices() {
        axios
            .get('https://testnet.binance.vision/api/v3/ticker/price')
            .then(function (response) {
                console.log(response)
            })
            .catch(function (error) {
                console.log(error)
            })
    }
}
