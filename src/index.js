"use strict"
const CognitoUserPoolIdFinder = require("./finders/CognitoUserPoolIdFinder")
const LambdaLayerArnFinder = require("./finders/LambdaLayerArnFinder")

const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}

class Static {}

class FindResourcePlugin {

  constructor(serverless, options) {
    this.serverless = serverless
    this.provider = this.serverless.providers.aws
    this.resolvedResources = {}
    this.userPools = undefined

    this.variableResolvers = {
      find: {
        resolver: this.handleVariable,
        serviceName: "find: can't be used for stage, region, or credentials",
        isDisabledAtPrepopulation: true
      },
    };

    this.handleVariable.bind(this)

    Static.this = this

    this.handlers = {
      CognitoUserPoolId: new CognitoUserPoolIdFinder().find.bind(this),
      LambdaLayerArn: new LambdaLayerArnFinder().find.bind(this)
    };
  }

  async handleVariable(name) {
    const segments = name.split(":")
    const resourceType = segments[1]

    if (Static.this.handlers[resourceType]) {
      let resourceName;
      if (segments.length > 2) {
        resourceName = segments[2]
      }

      const transformed = await Static.this.handlers[resourceType](
        resourceName
      );
      if (!transformed) {
        Static.this.serverless.cli.log(
          "No matching " +
            resourceType +
            " found for name '" +
            resourceName +
            "'"
        );
      }
      return transformed
    }
  }

}

module.exports = FindResourcePlugin
