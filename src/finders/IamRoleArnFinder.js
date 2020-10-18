class IamRoleArnFinder {

  async find(name) {

    if (!this.roleArns) {
      this.roleArns = {}
    }

    if (name) {
      if (!this.roleArns[name]) {
        // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/IAM.html
        const response = await this.provider.request(
          "IAM",
          "getRole",
          {
            RoleName: name,
          }
        )
        if (response.err) {
          console.error("Could not retrieve AWS IAM role " + name + ": " + err)
          return
        }

        const role = response.Role
        this.roleArns[name] = role.Arn
      }
    } else {
      // There should be only one role if the user has not provided a name
      const response = await this.provider.request(
        "IAM",
        "listRoles",
        {
          MaxItems: 1,
        }
      )

      if (response.err) {
        console.error("Could not retrieve AWS IAM roles: " + err)
        return
      }

      const role = response.Roles[0]
      this.roleArns[role.name] = role.Arn
      name = role.name
    }

    return this.roleArns[name]
  }
}

module.exports = IamRoleArnFinder
