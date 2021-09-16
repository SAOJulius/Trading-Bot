import Binance from 'node-binance-api'
import * as dotenv from 'dotenv'
import axios from 'axios'
import promptSync from 'prompt-sync'

const prompt = promptSync({ sigint: true })

export default class BinanceAccount {
    positions: Array<{ symbol: string; price: number }>
    possibleActivePositions: number
    active: boolean
    refreshIntervalId: any
    referenceAsset: string
    client: Binance
    currentLargecaps: Array<{ symbol: number }>
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
    public startCommandInterface = (): void => {
        this.active = true
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
    private startTrading = (): void => {
        this.refreshIntervalId = global.setInterval(this.checkSituation, 100)
        console.log('trading started')
    }
    private stopTrading(): void {
        clearInterval(this.refreshIntervalId)
        console.log('stopped all trading')
    }
    private checkSituation(): void {
        console.log('situation checked')
        this.checkSellSignal()
        this.checkBuySignal()
    }
    private checkBuySignal = (): void => {
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
            let opportunities: {
                symbol: string
                priceChangePercent: number
            }[] = []
            for (let assetOpenForTrade of this.currentLargecaps) {
                this.client
                    .prevDay(assetOpenForTrade.symbol + this.referenceAsset)
                    .then(
                        (res: {
                            symbol: string
                            priceChangePercent: number
                        }) => {
                            if (res.priceChangePercent <= -5.0) {
                                opportunities.push({
                                    symbol: res.symbol,
                                    priceChangePercent: res.priceChangePercent,
                                })
                            }
                        }
                    )
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
    private checkSellSignal = (): void => {
        if (this.positions.length > 0) {
            for (let position of this.positions) {
                let currentPrice: number | any
                this.client
                    .prices(position.symbol)
                    .then((res: Array<{ price: number }>) => {
                        currentPrice = res[0].price
                    })
                if ((position.price + position.price) * 0.01 <= currentPrice)
                    this.sell(position)
            }
        }
    }
    /**
     * @param asset
     * @param quantity
     */
    private buy = (
        asset: { symbol: string; priceChangePercent: number },
        quantity: number
    ): void => {
        this.client
            .marketBuy(asset.symbol, quantity)
            .then((res: { symbol: string; price: number }) => {
                console.log(res)
                this.positions.push({ symbol: res.symbol, price: res.price })
            })
            .catch((error: unknown) => {
                console.log(error)
            })
    }
    /**
     * @param position
     */
    private sell = (position: { symbol: string }): void => {
        this.client
            .marketSell(position.symbol)
            .then((res: JSON) => {
                console.log(res)
            })
            .catch((error: unknown) => {
                console.log(error)
            })
    }
}
