class LambdaLayerArnFinder {

  async find(name) {
    if (!this.lambdaLayers) {
      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html
      const response = await this.provider.request(
        "Lambda",
        "listLayers",
        {
          MaxItems: 50,
        }
      )
      if (response.err) {
        console.error("Could not retrieve AWS lambda layers: " + err)
        return
      }

      const layers = {}
      for (const layer of response.Layers) {
        layers[layer.LayerName] = layer.LatestMatchingVersion.LayerVersionArn
      }
      this.lambdaLayers = layers
    }

    const layerKeys = Object.keys(this.lambdaLayers);
    // If there's only one layer and no name was provided, just use the only one in AWS
    if (!name && layerKeys.length == 1) {
      return this.lambdaLayers[layerKeys[0]]
    } else {
      return this.lambdaLayers[name]
    }
  }
}

module.exports = LambdaLayerArnFinder
