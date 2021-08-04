/**
 * This finder try to find the Authorizer Id for a given ApiGatewayName/AuthorizerName
 */
class ApiGatewayAuthorizerIdFinder {

  async find(name) {
    const serverless = this.serverless
    const provider = this.provider
    let apiGatewayName
    let apiGatewayAuthorizerName

    if (name) {
      apiGatewayName = name.split("/")[0]
      apiGatewayAuthorizerName = name.split("/")[1]
    }

    const response = await this.provider.request(
      "APIGateway",
      "getRestApis",
      {
        limit: "500"
      }
    )
    if (response) {
      this.apiGatewayIds = {}
      for (const gateway of response.items) {
        this.apiGatewayIds[gateway.name] = gateway.id
      }
    }

    if (this.apiGatewayIds) {
      let apiGatewayId
      if (apiGatewayName && this.apiGatewayIds.hasOwnProperty(apiGatewayName)) {
        apiGatewayId = this.apiGatewayIds[apiGatewayName]
      } else {
        // If name is NOT given
        // Or given as /AuthorizerName(no apiGatewayName)
        // Or apiGatewayName does not find
        // Pick up the first apiGatewayId
        const keys = Object.keys(this.apiGatewayIds)
        apiGatewayId = this.apiGatewayIds[keys[0]]
      }
      const response = await this.provider.request(
        "APIGateway",
        "getAuthorizers",
        {
          restApiId: apiGatewayId,
          limit: "500"
        }
      )
      if (response) {
        this.apiGatewayAuthorizerIds = {}
        for (const authorizer of response.items) {
          this.apiGatewayAuthorizerIds[authorizer.name] = authorizer.id
        }
      }
      const keys = Object.keys(this.apiGatewayAuthorizerIds)
      if (apiGatewayAuthorizerName && keys.length() > 0 && this.apiGatewayAuthorizerIds.hasOwnProperty(apiGatewayAuthorizerName)) {
        return this.apiGatewayAuthorizerIds[apiGatewayAuthorizerName]
      } else {
        return this.apiGatewayAuthorizerIds[keys[0]]
      }
    } else {
      console.error("No API Gateways found in AWS")
      serverless.cli.log("No API Gateways found in AWS")
    }
  }
}

module.exports = ApiGatewayAuthorizerIdFinder
