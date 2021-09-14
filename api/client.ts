import Binance from 'node-binance-api'
import * as dotenv from 'dotenv'
import axios from 'axios'
import promptSync from 'prompt-sync'

const prompt = promptSync({ sigint: true })

export default class BinanceAccount {
    positions: Array<any>
    possibleActivePositions: Number
    active: Boolean = false
    refreshIntervalId: ReturnType<typeof setTimeout>
    referenceAsset: String = 'USDT'
    client: Binance
    constructor() {
        dotenv.config()
        this.client = new Binance().options({
            APIKEY: process.env.BINANCE_API_KEY,
            APISECRET: process.env.BINANCE_API_SECRET,
        })
    }
    startCommandInterface() {
        console.log(
            "Welcome to the Trading Bot. To see a list of commands type 'help'"
        )
        while (this.active === true) {
            const userInput = prompt('Ready for Commands > ')
            switch (userInput) {
                case 'help':
                    console.log(
                        '\n Available Commands: \n' +
                            'help - display info on available commands \n' +
                            'exit - exit shell \n' +
                            'start - start trading process \n' +
                            'stop - stop trading process \n'
                    )
                    break
                case 'exit':
                    this.active = false
                    break
                case 'start':
                    this.startTrading()
                    break
                case 'stop':
                    this.stopTrading()
                    break
            }
        }
    }
    startTrading() {
        console.log('trading started')
        this.refreshIntervalId = setInterval(this.checkSituation, 1000)
    }
    stopTrading() {
        clearInterval(this.refreshIntervalId)
        console.log('stopped all trading')
    }
    checkSituation() {
        console.log('situation checked')
        this.checkSellSignal()
        this.checkBuySignal()
    }
    checkBuySignal() {
        let largeCaps
        axios
            .get(
                'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?limit=10&sort=cmc_rank',
                {
                    headers: {
                        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_KEY,
                    },
                }
            )
            .then((res) => {
                largeCaps = res.data.data
            })
        if (this.positions.length < this.possibleActivePositions) {
            let opportunities = []
            for (let assetOpenForTrade of largeCaps) {
                this.client
                    .prevDay(assetOpenForTrade.symbol + this.referenceAsset)
                    .then((res) => {
                        if (res.priceChangePercent <= -5.0) {
                            opportunities.push({
                                symbol: res.symbol,
                                priceChangePercent: res.priceChangePercent,
                            })
                        }
                    })
            }
            if (opportunities.length > 0) {
                let bestOpportunity = {
                    symbol: null,
                    priceChangePercent: 0.0,
                }
                for (let opportunity of opportunities) {
                    if (
                        opportunity.priceChangePercent <
                        bestOpportunity.priceChangePercent
                    ) {
                        bestOpportunity = opportunity
                    }
                }
                this.buy(bestOpportunity, 1)
            }
        } else {
            console.log('Position limit exceeded')
        }
    }
    checkSellSignal() {
        if (this.positions.length > 0) {
            for (let position of this.positions) {
                let currentPrice
                this.client.prices(position.symbol).then((res) => {
                    currentPrice = res[position.symbol]
                })
                if ((position.price + position.price) * 0.01 <= currentPrice)
                    this.sell(position)
            }
        }
    }
    buy(asset, quantity) {
        this.client
            .marketBuy(asset.symbol, quantity)
            .then((res) => {
                console.log(res)
                this.positions.push({ symbol: res.symbol, price: res.price })
            })
            .catch((error) => {
                console.log(error)
            })
    }
    sell(position) {
        this.client
            .marketSell(position.symbol)
            .then((res) => {
                console.log(res)
            })
            .catch((error) => {
                console.log(error)
            })
    }
}
