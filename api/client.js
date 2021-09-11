import Binance from 'node-binance-api'
import dotenv from 'dotenv'

export default class ApiClient {
    constructor() {
        dotenv.config()
        this.client = new Binance().options({
            APIKEY: process.env.BINANCE_TEST_KEY,
            APISECRET:
                process.env.BINANCE_TEST_SECRET,
            useServerTime: true,
            verbose: true,
            urls: {
                base: 'https://testnet.binance.vision/api/',
                combineStream: 'wss://testnet.binance.vision/stream?streams=',
                stream: 'wss://testnet.binance.vision/ws/',
            },
        })
    }
    getBalance() {
        this.client.balance().then((res) => {
            console.log(res)
        })
    }
}
