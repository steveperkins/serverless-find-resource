class Ec2SubnetIdFinder {

  async find(name) {

    if (!this.subnetIds) {
      this.subnetIds = {}
    }

    let response
    if (name) {
      if (this.subnetIds[name]) {
        return this.subnetIds[name]
      }

      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
      response = await this.provider.request(
        "EC2",
        "describeSubnets",
        {
          DryRun: false,
          Filters: [{
            Name: "tag:Name",
            Values: [name],
          }],
          MaxResults: 5
        }
      )
    
      if (response.err) {
        console.error("Could not retrieve EC2 subnet " + name + ": " + err)
        return
      }
    } else {
      // There should be only one subnet if the user has not provided a name
      response = await this.provider.request(
        "EC2",
        "describeSubnets",
        {
          DryRun: false,
          Filters: [{
            Name: "tag-key",
            Values: ["Name"],
          }],
          MaxResults: 50
        }
      )

      if (response.err) {
        console.error("Could not retrieve EC2 subnets: " + err)
        return
      }
    }
    if (response.Subnets && response.Subnets.length) {
      let isFirst = true
      for (let subnet of response.Subnets) {
        let subnetName = ""
        for (let tag of subnet.Tags) {
          if (tag.Key == "Name") {
            subnetName = tag.Value
            if (isFirst) {
              name = subnetName
              isFirst = false
            }
            break
          }
        }
        this.subnetIds[subnetName] = subnet.SubnetId
      }
    }

    return this.subnetIds[name]
  }
}

module.exports = Ec2SubnetIdFinder
