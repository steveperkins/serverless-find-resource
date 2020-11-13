class Ec2SecurityGroupIdFinder {

  async find(name) {

    if (!this.securityGroupIds) {
      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
      const response = await this.provider.request(
        "EC2",
        "describeSecurityGroups",
        {
          DryRun: false,
          MaxResults: 500
        }
      )

      if (response.err) {
        console.error("Could not retrieve EC2 security groups: " + err)
        return
      }

      this.securityGroupIds = {}
      if (response.SecurityGroups && response.SecurityGroups.length) {
        for (let group of response.SecurityGroups) {
          let groupName
          for (let tag of group.Tags) {
            if (tag.Key == "Name") {
              groupName = tag.Value
              break
            }
          }
          if (groupName) {
            this.securityGroupIds[groupName] = group.GroupId
          }
        }
      } else {
        console.error("No security groups found")
      }
    }

    if (this.securityGroupIds.length <= 0) {
      console.error("No security groups to search")
      return
    }

    let group
    if (name) {
      group = this.securityGroupIds[name]
      if (!group) {
        console.error(`Security group ${name} not found`)
      }
    } else {
      // There should be only one security group if the user has not provided a name
      group = this.securityGroupIds[Object.keys(this.securityGroupIds)[0]]
    }
    return group
  }
}

module.exports = Ec2SecurityGroupIdFinder
