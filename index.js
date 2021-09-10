import ApiClient from 'api/client'

let client = new ApiClient()
client.getApiClient()

setInterval(ApiClient.getApiClient, 1000)
