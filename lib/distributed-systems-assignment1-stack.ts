import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/util";
import { beverages, beverageIngredients } from "../seed/beverages";

export class BeverageRestApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Table 1: Beverages
    const beveragesTable = new dynamodb.Table(this, "BeveragesTable", {
      tableName: "Beverages",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Table 2: BeverageIngredients
    const beverageIngredientsTable = new dynamodb.Table(
      this,
      "BeverageIngredientsTable",
      {
        tableName: "BeverageIngredients",
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        partitionKey: { name: "beverageId", type: dynamodb.AttributeType.NUMBER },
        sortKey: { name: "ingredientName", type: dynamodb.AttributeType.STRING },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    
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


  }
}
