import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { generateBatch } from "../shared/util";
import { beverages, beverageIngredients } from "../seed/beverages";
import * as apig from "aws-cdk-lib/aws-apigateway";


export class DistributedSystemsAssignment1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables
    // Beverages Table
    const beveragesTable = new dynamodb.Table(this, "BeveragesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Beverages",
    });

    // Beverage Ingredients Table
    const beverageIngredientsTable = new dynamodb.Table(this, "BeverageIngredientsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "beverageId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "ingredientName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "BeverageIngredients",
    });

    // Functions
    const getAllBeveragesFn = new lambdanode.NodejsFunction(this, "GetAllBeveragesFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getAllBeverages.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: "Beverages",
        REGION: "eu-west-1",
      },
    });

    const addBeverageFn = new lambdanode.NodejsFunction(this, "AddBeverageFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/addBeverage.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: "Beverages",
        REGION: "eu-west-1",
      },
    });


    // GET beverages by id
    const getBeverageByIdFn = new lambdanode.NodejsFunction(this, "GetBeverageByIdFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getBeverageById.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: beveragesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // GET ingredients by beverageId
    const getBeverageIngredientFn = new lambdanode.NodejsFunction(this, "GetBeverageIngredientFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getBeverageIngredient.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        INGREDIENTS_TABLE_NAME: beverageIngredientsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // Update beverage
    const updateBeverageFn = new lambdanode.NodejsFunction(this, "UpdateBeverageFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/updateBeverage.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: beveragesTable.tableName,
        REGION: "eu-west-1",
      },
    });


    // Seed initial data into the tables
    new custom.AwsCustomResource(this, "BeveragesInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [beveragesTable.tableName]: generateBatch(beverages),
            [beverageIngredientsTable.tableName]: generateBatch(beverageIngredients),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("BeveragesInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [beveragesTable.tableArn, beverageIngredientsTable.tableArn],
      }),
    });

    // Permissions
    beveragesTable.grantReadData(getAllBeveragesFn);
    beveragesTable.grantReadWriteData(addBeverageFn);
    beveragesTable.grantReadData(getBeverageByIdFn);
    beverageIngredientsTable.grantReadData(getBeverageIngredientFn);
    beveragesTable.grantReadWriteData(updateBeverageFn);

    // API Gateway
    const api = new apig.RestApi(this, "RestAPI", {
      description: "Beverage API",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    // Beverages API Endpoints
    const beveragesEndpoint = api.root.addResource("beverages");
    // GET /beverages
    beveragesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllBeveragesFn, { proxy: true })
    );
    // POST /beverages
    beveragesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(addBeverageFn, { proxy: true })
    );

    const beverageEndpoint = beveragesEndpoint.addResource("{beverageId}");
    // GET /beverages?id
    beverageEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getBeverageByIdFn, { proxy: true })
    );
    beverageEndpoint.addMethod(
      "PUT",
      new apig.LambdaIntegration(updateBeverageFn, { proxy: true })
    );

    const beverageIngredientEndpoint = beveragesEndpoint.addResource("ingredients"); 
    // GET /beverages?beverageId
    beverageIngredientEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getBeverageIngredientFn, { proxy: true })
    );


  }
}
