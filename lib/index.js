"use strict";

const chalk = require("chalk");

const get = (obj, path, defaultValue) => {
  return path
    .split(".")
    .filter(Boolean)
    .every((step) => !(step && !(obj = obj[step])))
    ? obj
    : defaultValue;
};

const isArn = (string) => {
  // An example ARN:
  // arn:aws:lambda:us-east-1:000000000000:layer:common:1
  const regex = /arn:aws:lambda:.+?:.+?:layer:.+?:[\d+]/g;
  const found = string.match(regex);
  if (found) {
    return true;
  } else {
    return false;
  }
};

class ResolveLambdaLayersPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;

    this.provider = this.serverless.providers.aws;

    this.hooks = {
      "before:package:setupProviderConfiguration": this.resolveLambdaLayerArns.bind(
        this
      ),
    };
  }

  async resolveLambdaLayerArns() {
    try {
      // Look through the lambda functions to see if they use any layers. Replace the layer ARN with the latest version.
      const response = await this.provider.request("Lambda", "listLayers", {
        MaxItems: 50,
      });
      const existingLayers = {};
      for (let layer of get(response, "Layers", [])) {
        existingLayers[layer.LayerName] =
          layer.LatestMatchingVersion.LayerVersionArn;
      }

      // The layers can be specified in each lambda function definition or in the `providers` section.
      // First we'll check the providers section. It should be a list of ARNs or layer names.
      this.serverless.service.provider.layers = this._resolveLayerArns(
        this.serverless.service.provider.layers,
        existingLayers
      );
      // Next we'll check each function. Their layers, if they exist, should also be a list of ARNs or layer names.
      if (this.serverless.service.functions !== undefined) {
        // If this serverless.yml has lambda functions
        // Loop through the lambdas and look for layers.
        for (let [fname, func] of Object.entries(
          this.serverless.service.functions
        )) {
          if (func.layers !== undefined) {
            func.layers = this._resolveLayerArns(func.layers, existingLayers);
          }
        }
      }
    } catch (e) {
      console.error(
        chalk.red(
          `\n-------- Resolve Lambda Layers Error --------\n${e.message}`
        )
      );
    }
  }

  _resolveLayerArns(layers, existingLayers) {
    let resolvedAny = false;
    const resolvedLayers = [];
    for (let layer of layers) {
      if (isArn(layer)) {
        resolvedLayers.push(layer);
      } else {
        try {
          resolvedLayers.push(existingLayers[layer]);
          resolvedAny = true;
        } catch (e) {
          this.serverless.cli.log(
            `Unable to find layer in AWS list-layers: ${layer} ${existingLayers}'`
          );
        }
      }
    }
    if (resolvedAny) {
      this.serverless.cli.log(`Resolved layer ARNs: ${resolvedLayers}`);
    }
    return resolvedLayers;
  }
}

module.exports = ResolveLambdaLayersPlugin;
