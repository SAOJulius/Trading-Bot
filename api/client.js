import Binance from 'node-binance-api'

export default class ApiClient {
    getApiClient() {
        return new Binance().options({
            APIKEY: 'YIytFyvhOJ3N3I09gTtdu0gjt8u7dtSu3UsAw59Gfj68PdPfAUmIbWo7U44ahunp',
            APISECRET:
                'KYgckMDKoZ3StiOBZu6GrSt2FFiqUWB2wMNlR3iMDd31ZsprfJzgbimyZLV6vp49',
        })
    }
}
