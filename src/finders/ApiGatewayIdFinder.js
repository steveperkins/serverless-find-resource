class ApiGatewayIdFinder {
  
  async find(name) {
    if (!this.apiGatewayIds) {
      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html
      const response = await this.provider.request(
        "APIGateway",
        "getRestApis",
        {
          limit: "50"
        }
      )
      if (response) {
        this.apiGatewayIds = {}
        for (const gateway of response.items) {
          this.apiGatewayIds[gateway.name] = gateway.id
        }
      }
    }

    if (this.apiGatewayIds) {
      if (name) {
        console.log("Returning " + this.apiGatewayIds[name])
        return this.apiGatewayIds[name]
      }

      // If no name was provided, use the first API Gateway
      const keys = Object.keys(this.apiGatewayIds)
      if (keys.length >= 1) {
        return this.apiGatewayIds[keys[0]]
      }
    } else {
      console.error("No API Gateways found in AWS")
    }
  }
}

module.exports = ApiGatewayIdFinder
