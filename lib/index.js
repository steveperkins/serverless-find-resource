"use strict";

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

class Static {}

class FindResourcePlugin {
  constructor(serverless, options) {
    // console.log(
    //   "Serverless: " + JSON.stringify(serverless, getCircularReplacer())
    // );
    this.serverless = serverless;
    this.provider = this.serverless.providers.aws;
    this.resolvedResources = {};
    this.userPools = undefined;

    this.variableResolvers = {
      findArn: {
        resolver: this.handleVariable,
        serviceName: "find: can't be used for stage, region, or credentials",
        isDisabledAtPrepopulation: true,
      },
    };

    this.handleVariable.bind(this);

    this.handlers = {
      CognitoUserPoolId: this.handleCognitoUserPoolId.bind(this),
    };

    Static.this = this;
  }

  async handleVariable(name) {
    const segments = name.split(":");
    const resourceType = segments[1];

    if (Static.this.handlers[resourceType]) {
      let resourceName;
      if (segments.length > 2) {
        resourceName = segments[2];
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
      return transformed;
    }
  }

  async handleCognitoUserPoolId(name) {
    if (!Static.this.userPools) {
      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html
      const response = await Static.this.provider.request(
        "CognitoIdentityServiceProvider",
        "listUserPools",
        {
          MaxResults: 50,
        }
      );
      if (response) {
        Static.this.userPools = {};
        for (const pool of response.UserPools) {
          Static.this.userPools[pool.Name] = pool.Id;
        }
      }
    }

    const poolKeys = Object.keys(Static.this.userPools);
    // If there's only one user pool and no name was provided, just use the only one in AWS
    if (!name && Object.keys(Static.this.userPools).length == 1) {
      return Static.this.userPools[poolKeys[0]];
    } else {
      return Static.this.userPools[name];
    }
  }
}

module.exports = FindResourcePlugin;
