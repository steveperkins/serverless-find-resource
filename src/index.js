"use strict"
const CognitoUserPoolIdFinder = require("./finders/CognitoUserPoolIdFinder")
const LambdaLayerArnFinder = require("./finders/LambdaLayerArnFinder")
const IamRoleArnFinder = require("./finders/IamRoleArnFinder")
const IamRoleIdFinder = require("./finders/IamRoleIdFinder")
const Ec2SecurityGroupIdFinder = require("./finders/Ec2SecurityGroupIdFinder")
const Ec2SubnetIdFinder = require("./finders/Ec2SubnetIdFinder")
const ApiGatewayIdFinder = require("./finders/ApiGatewayIdFinder")

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
      LambdaLayerArn: new LambdaLayerArnFinder().find.bind(this),
      RoleArn: new IamRoleArnFinder().find.bind(this),
      RoleId: new IamRoleIdFinder().find.bind(this),
      SecurityGroupId: new Ec2SecurityGroupIdFinder().find.bind(this),
      SubnetId: new Ec2SubnetIdFinder().find.bind(this),
      ApiGatewayId: new ApiGatewayIdFinder().find.bind(this)
    };

    // this.hooks['before:package:setupProviderConfiguration'] = this.importApiGateway.bind(this)
  }

  async handleVariable(name) {
    const segments = name.split(":")
    const resourceType = segments[1]

    if (Static.this.handlers[resourceType]) {
      let resourceName;
      if (segments.length > 2) {
        resourceName = segments[2].replace(/'/g, "")
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
