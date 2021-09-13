import Binance from 'node-binance-api'
import dotenv from 'dotenv'
import axios from 'axios'
import promptSync from 'prompt-sync'

const prompt = promptSync({ sigint: true })

export default class BinanceAccount {
    constructor() {
        dotenv.config()
        this.client = new Binance().options({
            APIKEY: process.env.BINANCE_API_KEY,
            APISECRET: process.env.BINANCE_API_SECRET,
        })
        this.possibleActivePositions = 1
        this.positions = []
        this.active = true
        this.botTrading = false
        this.referenceAsset = 'USDT'
    }
    startCommandInterface() {
        console.log(
            "Welcome to the Trading Bot. To see a list of commands type 'help'"
        )
        while (this.active === true) {
            const userInput = prompt('Ready for Commands')
            switch (userInput) {
                case 'help':
                    console.log(
                        'Available Commands: \n' +
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
        console.log('starting to trade...')
        while (this.botTrading === true) {
            setInterval(this.checkSituation, 60000)
        }
    }
    stopTrading() {
        this.botTrading = false
        console.log('stopped all trading')
    }
    checkSituation() {
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
                this.client.prevDay(
                    assetOpenForTrade.symbol + this.referenceAsset,
                    (error, prevDay) => {
                        if (prevDay.priceChangePercent <= -5.0) {
                            opportunities.push({
                                symbol: prevDay.symbol,
                                priceChangePercent: prevDay.priceChangePercent,
                            })
                        }
                    }
                )
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
                this.buy(bestOpportunity)
            }
        } else {
            console.log('Position limit exceeded')
        }
    }
    checkSellSignal() {
        if (this.positions.length > 0) {
            for (let position in this.positions) {
                if (position.price < positions.price + 2) {
                    this.sell(position)
                }
            }
        }
    }
    buy(position, quantity) {
        this.client
            .marketBuy(position.symbol, quantity)
            .then((res) => {
                console.log(res)
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
