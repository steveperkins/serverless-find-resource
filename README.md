# serverless-resolve-lambda-layers

This Serverless plugin allows you to specify lambda layers by their name rather than their ARN in Serverless templates.

AWS's Lambda Layers functionality provides a great way to store common dependencies, but deployment processes that create and use those dependencies have many issues that partially negatate their usefulness. This is in large part due to the how the layer versioning works. This plugin allows you to specify the layer name rather than the layer ARN in your Serverless templates, which allows your deployment process to sidestep many of the issues.

## Installation

In your `package.json`'s `dependencies` or `devDependencies` section, add `"serverless-resolve-lambda-layers": "https://github.com/jjmaldonis/serverless-resolve-lambda-layers#master"`, then run `npm install`.

## Usage

In your serverless template include the following in your `plugins` section:

```
plugins:
  - serverless-resolve-lambda-layers
```

Then you can replace your lambda layer ARNs with their names.

So replace this

```
layers:
  - arn:aws:lambda:us-east-1:000000000000:layer:common:1
  - arn:aws:lambda:us-east-1:000000000000:layer:utils:1
```

with this

```
layers:
  - common
  - utils
```

That's it!
