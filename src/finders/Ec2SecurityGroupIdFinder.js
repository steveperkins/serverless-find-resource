class Ec2SecurityGroupIdFinder {

  async find(name) {

    if (!this.securityGroupIds) {
      this.securityGroupIds = {}
    }

    let response
    if (name) {
      if (this.securityGroupIds[name]) {
        return this.securityGroupIds[name]
      }

      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
      response = await this.provider.request(
        "EC2",
        "describeSecurityGroups",
        {
          DryRun: false,
          Filters: [{
            Name: "tag:Name",
            Values: [name],
          }],
          MaxResults: 6
        }
      )
    
      if (response.err) {
        console.error("Could not retrieve AWS EC2 security group " + name + ": " + err)
        return
      }
    } else {
      // There should be only one group if the user has not provided a name
      response = await this.provider.request(
        "EC2",
        "describeSecurityGroups",
        {
          DryRun: false,
          MaxResults: 50
        }
      )

      if (response.err) {
        console.error("Could not retrieve EC2 security groups: " + err)
        return
      }
    }
    if (response.SecurityGroups && response.SecurityGroups.length) {
      let isFirst = true
      for (let group of response.SecurityGroups) {
        let groupName = ""
        for (let tag of group.Tags) {
          if (tag.Key == "Name") {
            groupName = tag.Value
            if (isFirst) {
              name = groupName
              isFirst = false
            }
            break
          }
        }
        this.securityGroupIds[name] = group.GroupId
      }
    } else {
      console.error("No matching security groups found")
    }

    return this.securityGroupIds[name]
  }
}

module.exports = Ec2SecurityGroupIdFinder
