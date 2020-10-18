class CognitoUserPoolIdFinder {
  
  async find(name) {
    if (!this.userPools) {
      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html
      const response = await this.provider.request(
        "CognitoIdentityServiceProvider",
        "listUserPools",
        {
          MaxResults: 50,
        }
      )
      if (response) {
        this.userPools = {}
        for (const pool of response.UserPools) {
          this.userPools[pool.Name] = pool.Id
        }
      }
    }

    const poolKeys = Object.keys(this.userPools)
    // If there's only one user pool and no name was provided, just use the only one in AWS
    if (!name && Object.keys(this.userPools).length == 1) {
      return this.userPools[poolKeys[0]]
    } else {
      return this.userPools[name]
    }
  }
}

module.exports = CognitoUserPoolIdFinder
