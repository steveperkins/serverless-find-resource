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
      let apiGatewayAuthorizerId
      if (apiGatewayName) {
        apiGatewayId = this.apiGatewayIds[apiGatewayName]
      } else {
        // If no name was provided, use the first API Gateway
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
      if (apiGateayAuthorizerName) {
          apiGatewayAuthorizerId = this.apiGatewayAuthorizerIds[apiGatewayAuthorizerName]
      } else {
        const keys = Object.keys(this.apiGatewayAuthorzierIds)
        apiGatewayAuthorizerId = this.apiGateayAuthorizerIds[keys[0]]
      }
      return apiGatewayAuthorizerId
    } else {
      console.error("No API Gateways found in AWS")
      serverless.cli.log("No API Gateways found in AWS")
    }
  }
}

module.exports = ApiGatewayAuthorizerIdFinder
