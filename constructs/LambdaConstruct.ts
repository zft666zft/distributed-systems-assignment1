import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface LambdaConstructProps {
  functionName: string;
  handler: string;
  environment?: { [key: string]: string };
}

export class LambdaConstruct extends Construct {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    this.lambdaFunction = new lambda.Function(this, props.functionName, {
        functionName: props.functionName,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: props.handler, 
        code: lambda.Code.fromAsset("lambdas"), 
        environment: props.environment || {},
      });
  }
}
