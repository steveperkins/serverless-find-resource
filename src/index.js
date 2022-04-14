"use strict"
const CognitoUserPoolIdFinder = require("./finders/CognitoUserPoolIdFinder")
const CognitoUserPoolArnFinder = require("./finders/CognitoUserPoolArnFinder")
const CognitoAppClientIdFinder = require("./finders/CognitoAppClientIdFinder")
const LambdaLayerArnFinder = require("./finders/LambdaLayerArnFinder")
const IamRoleArnFinder = require("./finders/IamRoleArnFinder")
const IamRoleIdFinder = require("./finders/IamRoleIdFinder")
const Ec2SecurityGroupIdFinder = require("./finders/Ec2SecurityGroupIdFinder")
const Ec2SubnetIdFinder = require("./finders/Ec2SubnetIdFinder")
const ApiGatewayIdFinder = require("./finders/ApiGatewayIdFinder")
const ApiGatewayAuthorizerIdFinder = require("./finders/ApiGatewayAuthorizerIdFinder")

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

    this.handleVariable.bind(this)

    // v2 variable resolver
    this.variableResolvers = {
      find: {
        resolver: this.handleVariableV2,
        serviceName: "find: can't be used for stage, region, or credentials",
        isDisabledAtPrepopulation: true
      }
    };

    this.handleVariableV2.bind(this)

    // v3 variable resolver
    this.configurationVariablesSources = {
      find: {
        resolve: this.handleVariableV3,
        serviceName: "find: can't be used for stage, region, or credentials",
        isDisabledAtPrepopulation: true
      }
    };

    this.handleVariableV3.bind(this)

    Static.this = this

    this.handlers = {
      CognitoUserPoolId: new CognitoUserPoolIdFinder().find.bind(this),
      CognitoUserPoolArn: new CognitoUserPoolArnFinder().find.bind(this),
      CognitoAppClientId: new CognitoAppClientIdFinder().find.bind(this),
      LambdaLayerArn: new LambdaLayerArnFinder().find.bind(this),
      RoleArn: new IamRoleArnFinder().find.bind(this),
      RoleId: new IamRoleIdFinder().find.bind(this),
      SecurityGroupId: new Ec2SecurityGroupIdFinder().find.bind(this),
      SubnetId: new Ec2SubnetIdFinder().find.bind(this),
      ApiGatewayId: new ApiGatewayIdFinder().find.bind(this),
      ApiGatewayAuthorizerId: new ApiGatewayAuthorizerIdFinder().find.bind(this)
    };
  }

  async handleVariable(name, slsVersion) {
    const segments = name.split(":")
    // In v3 Serverless removes the "find" token from the name string passed to us
    const firstSegmentIndex = "v3" === slsVersion ? 0 : 1
    const resourceType = segments[firstSegmentIndex]

    if (Static.this.handlers[resourceType]) {
      let resourceName;
      if (segments.length > firstSegmentIndex + 1) {
        resourceName = segments[firstSegmentIndex + 1].replace(/'/g, "")
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

  async handleVariableV2(name) {
    return Static.this.handleVariable(name, "v2")
  }

  async handleVariableV3({ address }) {
    const variableValue = await Static.this.handleVariable(address, "v3")
    return { value: variableValue }
  }

}

module.exports = FindResourcePlugin
