/**
 * This finder is a little different from other finders in that it not only looks up an API Gateway's ID
 * from it's name, but also imports its resources into the Serverless template.
 */
class ApiGatewayIdFinder {
  
  async find(name) {
    const serverless = this.serverless
    const provider = this.provider

    const get = function(obj, path, defaultValue) {
      return path.split('.').filter(Boolean).every(step => !(step && !(obj = obj[step]))) ? obj : defaultValue
    }
    
    const getApiGatewayPaths = async function (apiGatewayId) {
      const paths = {}
      const response = await provider.request("APIGateway", "getResources", { limit: 500, restApiId: apiGatewayId })
      if (response.items) {
        for (let resource of response.items) {
          paths[resource.path] = resource.id
        }
      }

      return paths
    }
    
    const importApiGateway = async (apiGatewayId) => {
      serverless.service.provider.apiGateway = get(serverless.service, "provider.apiGateway", {})
      // Respect the user's API Gateway root path if provided 
      const config = get(serverless.service, "custom.apiGateway", {})
      config.rootPath = get(config, "rootPath", "/")

      if (!apiGatewayId) {
        throw new Error("API Gateway ID is required")
      }

      const paths = await getApiGatewayPaths(apiGatewayId)
      if (!paths) {
        throw new Error(`No resources found in API Gateway ID ${apiGatewayId}!`)
      }

      const rootResourceId = paths[config.rootPath]
      if (!rootResourceId) {
        throw new Error(`No root resource matching ${config.rootPath} exists on API Gateway ${apiGatewayId}`)
      }

      const existingPaths = Object.keys(paths)
      const resourcesToImport = {}
      for (let resourcePath of existingPaths) {
        const resourceId = paths[resourcePath]
        if (!resourceId) {
          throw new Error(`No path ${resourcePath} found in API Gateway ${apiGatewayId}`)
        }

        resourcesToImport[resourcePath] = resourceId
      }

      serverless.service.provider.apiGateway.restApiId = apiGatewayId
      serverless.service.provider.apiGateway.restApiRootResourceId = rootResourceId
      serverless.service.provider.apiGateway.restApiResources = resourcesToImport
      serverless.cli.log(`Imported API Gateway (${JSON.stringify(serverless.service.provider.apiGateway)})`)
    }



    if (!this.apiGatewayIds) {
      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html
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
    }

    if (this.apiGatewayIds) {
      let apiGatewayId
      if (name) {
        apiGatewayId = this.apiGatewayIds[name]
      } else {
        // If no name was provided, use the first API Gateway
        const keys = Object.keys(this.apiGatewayIds)
        apiGatewayId = this.apiGatewayIds[keys[0]]
      }

      await importApiGateway(apiGatewayId)
      return apiGatewayId
    } else {
      console.error("No API Gateways found in AWS")
      serverless.cli.log("No API Gateways found in AWS")
    }
  }
}

module.exports = ApiGatewayIdFinder
