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
    if (layerKeys.length <= 0) {
      console.error("No layers found")
      return
    }

    // If no name was provided, just use the only one in AWS
    let layer
    if (name) {
      layer = this.lambdaLayers[name]
    } else {
      layer = this.lambdaLayers[layerKeys[0]]
    }
    return layer
  }
}

module.exports = LambdaLayerArnFinder
