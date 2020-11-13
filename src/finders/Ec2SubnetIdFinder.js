class Ec2SubnetIdFinder {

  async find(name) {

    if (!this.subnetIds) {
      // See for available functions https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html
      const response = await this.provider.request(
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
        console.error(`Could not retrieve EC2 subnets: ${err}`)
        return
      }

      if (!response.Subnets || response.Subnets.length < 1) {
        console.error("No subnets found")
        return
      }

      this.subnetIds = {}
      if (response.Subnets && response.Subnets.length) {
        for (let subnet of response.Subnets) {
          let subnetName = ""
          for (let tag of subnet.Tags) {
            if (tag.Key == "Name") {
              subnetName = tag.Value
              break
            }
          }
          this.subnetIds[subnetName] = subnet.SubnetId
        }
      }
    }


    if (!this.subnetIds || Object.keys(this.subnetIds).length <= 0) {
      console.error("No subnets to search")
      return
    }

    let subnet
    if (name) {
      subnet = this.subnetIds[name]
      if (!subnet) {
        console.error(`Subnet ${name} not found`)
      }
    } else {
      // There should be only one subnet if the user has not provided a name
      subnet = this.subnetIds[Object.keys(this.subnetIds)[0]]
    }
    return subnet
  }
}

module.exports = Ec2SubnetIdFinder
