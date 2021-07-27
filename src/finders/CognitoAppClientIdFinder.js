class CognitoAppClientIdFinder {

  async find(name) {
    // Split the name on a period. The expected syntax for `name` is `<UserPoolName>.<AppClientName>`
    const split = name.split(".")
    const userPoolName = split[0];
    const appClientName = split[1];
    if (!this.userPoolIds) {
      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html
      const response = await this.provider.request(
        "CognitoIdentityServiceProvider",
        "listUserPools",
        {
          MaxResults: 60,
        }
      )
      if (response.err) {
        console.error("Could not retrieve user pool information " + name + ": " + response.err)
        return
      }
      if (response) {
        this.userPoolIds = {}
        for (const pool of response.UserPools) {
          this.userPoolIds[pool.Name] = pool.Id
        }
      }
    }

    const poolKeys = Object.keys(this.userPoolIds)
    this.selectedUserPool = null
    // If there's only one user pool and no name was provided, just use the only one in AWS
    if (!userPoolName && poolKeys.length > 0) {
      this.selectedUserPool = this.userPoolIds[poolKeys[0]]
    } else {
      this.selectedUserPool = this.userPoolIds[userPoolName]
    }

    if (this.selectedUserPool !== null) {
      const response = await this.provider.request(
        "CognitoIdentityServiceProvider",
        "listUserPoolClients",
        {
          UserPoolId: this.selectedUserPool,
          MaxResults: 60,
        }
      )
      if (response.err) {
        console.error("Could not retrieve app client information " + name + ": " + response.err)
        return
      }
      if (response) {
        this.appClientIds = {}
        for (const client of response.UserPoolClients) {
          this.appClientIds[client.ClientName] = client.ClientId
        }
      }

      const clientKeys = Object.keys(this.appClientIds)
      // If there's only one app client and no name was provided, just use the only one in AWS
      if (!appClientName && clientKeys.length > 0) {
        return this.appClientIds[clientKeys[0]]
      } else {
        return this.appClientIds[appClientName]
      }

    }
  }
}

module.exports = CognitoAppClientIdFinder
