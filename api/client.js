import Binance from 'node-binance-api'
import dotenv from 'dotenv'

export default class BinanceAccount {
    constructor() {
        dotenv.config()
        this.client = new Binance().options({
            APIKEY: process.env.BINANCE_API_KEY,
            APISECRET: process.env.BINANCE_API_SECRET,
        })
        this.possibleActivePositions = 1
        this.positions = []
        this.active = false
        this.assetsOpenForTrade = [BTCUSD]
    }
    startTrading() {
        console.log('starting to trade...')
        setInterval(checkSituation, 60000)
    }
    stopTrading() {
        console.log('stopped all trading')
    }
    checkSituation() {
        this.checkSellSignal()
        this.checkBuySignal()
    }
    checkBuySignal() {
        if (this.positions.length < this.possibleActivePositions) {
            let opportunities = []
            this.client.prevDay(false, (error, prevDay) => {
                for (let obj of prevDay) {
                    if (obj.priceChangePercent) {
                    }
                }
            })
        } else {
            console.log('Position limit exceeded')
        }
    }
    checkSellSignal() {
        if (this.positions.length > 0) {
            if (this.positions[0].price < this.positions[0].price + 2) {
                this.sell(this.positions[0])
            }
        }
    }
    buy(asset, quantity) {
        this.client.marketBuy(asset).then((res) => {
            this.positions.push(res)
        })
        console.log(`${asset.symbol} bought`)
    }
    sell(asset) {
        this.client.marketSell(asset.symbol, asset.quantity)
        console.log(`${asset.symbol} sold`)
    }
}
