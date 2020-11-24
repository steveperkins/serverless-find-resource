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
      const pathsMap = {}

      const response = await provider.request("APIGateway", "getResources", { limit: 500, restApiId: apiGatewayId })
      if (response.items) {
        for (let resource of response.items) {
          pathsMap[resource.path] = resource.id
        }
      }

      return pathsMap
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

      // Serverless purports to natively support shared API Gateways. The documentation neglects to mention that both
      // an apiGatewayId and a rootResourceId must be provided. And that none of the paths in any Serverless template
      // can be substrings of the paths in the current template (otherwise you'll get a parent name conflict because
      // CloudFormation isn't smart enough to recognize that you're not redeploying e.g. /company/{companyId}, you're
      // just trying to deploy /company/{companyId}/users).
      //
      // To avoid the name conflict, you can specify restApiResources - a map of path:resourceId. Who's going to manually
      // add that?! What good is a Serverless template if I have to specify the root resource ID, which will change in
      // every environment?! Even when done according to the documentation, using restApiResources causes weird API
      // Gateway behavior - the resources are added to the target stage, but DELETED from the stage-less root resource tree.
      // On the next deployment, they're re-added to the stage-less root resource tree and continue to flip-flop on each deploy.
      //
      // So here we're doing the best we can to supply all of the configuration we can to Serverless so it does the least-harmful
      // thing - actually deploying the endpoints in this Serverless template, but flip-flopping between adding and deleting
      // them in the stage-less root resource tree.
      const matchingResourcePaths = []
      if (serverless.service.functions) { 
        for (let [fname, lambda] of Object.entries(serverless.service.functions)) {
          if (lambda.events) {
            for (let event of lambda.events) {
              // We only care about lambdas that define an API Gateway integration
              if (event.http && event.http.path) {
                // We have a new HTTP path that needs to be added to the gateway. Check to see if a similar path already exists. If so, add it.
                for (let path of Object.keys(paths)) {
                  if (event.http.path.startsWith(path)) {
                    matchingResourcePaths.push(path)
                  }
                }
              }
            }
          }
        }
      }

      const resourcesToImport = {}
      for (let resourcePath of matchingResourcePaths) {
        resourcesToImport[resourcePath] = paths[resourcePath]
      }

      serverless.service.provider.apiGateway.restApiId = apiGatewayId
      serverless.service.provider.apiGateway.restApiRootResourceId = rootResourceId
      serverless.service.provider.apiGateway.restApiResources = resourcesToImport
      serverless.cli.log(`Imported API Gateway (${JSON.stringify(serverless.service.provider.apiGateway)})`)
    }

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
