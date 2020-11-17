class CognitoUserPoolArnFinder {
  
  async find(name) {
    if (!this.userPoolArns) {
      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html
      const response = await this.provider.request(
        "CognitoIdentityServiceProvider",
        "listUserPools",
        {
          MaxResults: 60,
        }
      )
      if (response) {
        this.userPoolArns = {}
        for (const pool of response.UserPools) {
          this.userPoolArns[pool.Name] = pool.Arn
        }
      }
    }

    const poolKeys = Object.keys(this.userPoolArns)
    // If there's only one user pool and no name was provided, just use the only one in AWS
    if (!name && poolKeys.length > 0) {
      return this.userPoolArns[poolKeys[0]]
    } else {
      return this.userPoolArns[name]
    }
  }
}

module.exports = CognitoUserPoolArnFinder
