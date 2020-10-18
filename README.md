# serverless-find-resource

This Serverless plugin replaces AWS resource names with their ARNs or IDs in your Serverless template.

Some Serverless resource references have to be hardcoded if they're created outside of the current Serverless template - even if they're created by another Serverless template in the same project. In multi-template projects, this results in hardcoding resource IDs or creating lots of exports just to reference AWS resource ARNs/IDs. As a result, your Serverless templates lose flexibility and require a bunch of changes when just one resource changes. For example, if you expect your system's Cognito User Pool to be manually created but still want to attach a pre-token-generation trigger to it, you have to update your template in every environment to point to the correct Cognito User Pool ID.

This Serverless plugin fixes that. Instead of hardcoding resource ARNs and IDs, you can use your resource _names_ in your Serverless templates, and this plugin will replace it with the appropriate resource ARN/ID by inspecting the resources in your AWS account (via the CLI). Even better, if there's only one resource of the given type, Serverless Find Resource can assume that you need that resource's ARN/ID unless you specify a name.

That means that a simple Serverless template could reference zero AWS resource identifiers, making it far more flexible and portable across environments.

## Installation

`serverless-find-resource` is available on npm: [https://www.npmjs.com/package/serverless-find-resource](https://www.npmjs.com/package/serverless-find-resource).

1. Run `npm i serverless-find-resource --save-dev`. Of course you also need Serverless to be installed because this is a Serverless plugin.
2. In your Serverless template add `serverless-find-resource` to your `plugins` section:

```
plugins:
  - serverless-find-resource
```

### Early Access

If you don't want to wait for releases, you can get bleeding-edge updates by adding `"serverless-find-resource": "https://github.com/steveperkins/serverless-find-resource#master"` to your `package.json`'s `dependencies` or `devDependencies`.

## Usage

Replace your hardcoded IDs with `find:` variables anywhere in your Serverless template except region, stage, and credentials.

For example, this:

```
provider:
  name: aws
  stage: ${self:custom.stage}
  region: ${self:custom.region}
  environment:
    USER_POOL_ID: us-east-1_D93eA2
```

becomes this:

```
provider:
  name: aws
  stage: ${self:custom.stage}
  region: ${self:custom.region}
  environment:
    USER_POOL_ID: ${find:CognitoUserPoolId:yourUserPoolName}
```

Serverless Find Resource will now replace `${find:CognitoUserPoolId}` with the ID of your AWS account's user pool named `yourUserPoolName`.

## Finding Resources by Default

If you have only one of a resource type in your AWS account, you don't even have to provide a name - Serverless Find Resource will just use that resource. The syntax is very straightforward - you just don't include the name:

```
${find:CognitoUserPoolId}
```

That makes your Serverless template very clean for shared resources like Cognito User Pools, RDS databases, API Gateways, etc.

# Supported Resource Types

| Type              | Key                 | Returns                | Example                                      |
| ----------------- | ------------------- | ---------------------- | -------------------------------------------- |
| Cognito User Pool | `CognitoUserPoolId` | Cognito User Pool's ID | `${find:CognitoUserPoolId:yourUserPoolName}` |
| Lambda Layer      | `LambdaLayerArn`    | Latest layer ARN       | `${find:LambdaLayerArn:yourLayerName}`       |
| IAM Role          | `RoleArn`           | Role's ARN             | `${find:RoleArn:yourRoleName}`               |
| IAM Role          | `RoleId`            | Role's ID              | `${find:RoleId:yourRoleName}`                |
