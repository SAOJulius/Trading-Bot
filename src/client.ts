import Binance from 'node-binance-api'
import * as dotenv from 'dotenv'
import axios from 'axios'
import promptSync from 'prompt-sync'

const prompt = promptSync({ sigint: true })

export default class BinanceAccount {
    positions: Array<any>
    possibleActivePositions: number
    active: boolean
    refreshIntervalId: any
    referenceAsset: string
    client: Binance
    currentLargecaps: Array<any>
    constructor() {
        dotenv.config()
        this.client = new Binance().options({
            APIKEY: process.env.BINANCE_API_KEY,
            APISECRET: process.env.BINANCE_API_SECRET,
        })
        this.referenceAsset = 'USDT'
        this.active = false
        this.possibleActivePositions = 1
        this.positions = []
        this.currentLargecaps = []
    }
    startCommandInterface() {
        console.log(
            "Welcome to the Trading Bot. To see a list of commands type 'help'"
        )
        while (this.active) {
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
                this.currentLargecaps = res.data.data
            })
        if (this.positions.length < this.possibleActivePositions) {
            let opportunities: { symbol: any; priceChangePercent: number }[] =
                []
            for (let assetOpenForTrade of this.currentLargecaps) {
                this.client
                    .prevDay(assetOpenForTrade.symbol + this.referenceAsset)
                    .then((res: any) => {
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
                    symbol: '',
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
                let currentPrice: any
                this.client.prices(position.symbol).then((res: any) => {
                    currentPrice = res[position.symbol]
                })
                if ((position.price + position.price) * 0.01 <= currentPrice)
                    this.sell(position)
            }
        }
    }
    /**
     *
     * @param asset
     * @param quantity
     */
    buy(
        asset: { symbol: string; priceChangePercent: number },
        quantity: number
    ) {
        this.client
            .marketBuy(asset.symbol, quantity)
            .then((res: any) => {
                console.log(res)
                this.positions.push({ symbol: res.symbol, price: res.price })
            })
            .catch((error: any) => {
                console.log(error)
            })
    }
    /**
     * @param position
     */
    sell(position: { symbol: string }) {
        this.client
            .marketSell(position.symbol)
            .then((res: JSON) => {
                console.log(res)
            })
            .catch((error: any) => {
                console.log(error)
            })
    }
}
