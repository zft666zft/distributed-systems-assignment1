import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));

    const parameters = event?.pathParameters;
    const beverageId = parameters?.beverageId ? parseInt(parameters.beverageId) : undefined;
    const body = event.body ? JSON.parse(event.body) : undefined;

    if (!beverageId || !body) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing beverage ID or request body" }),
      };
    }

    const updateExpression = [];
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, any> = {}; 

    if (body.name) {
      updateExpression.push("#name = :name"); 
      expressionAttributeValues[":name"] = body.name;
      expressionAttributeNames["#name"] = "name"; 
    }
    if (body.price !== undefined) {
      updateExpression.push("#price = :price"); 
      expressionAttributeValues[":price"] = body.price;
      expressionAttributeNames["#price"] = "price";
    }
    if (body.isCarbonated !== undefined) {
      updateExpression.push("#isCarbonated = :isCarbonated"); 
      expressionAttributeValues[":isCarbonated"] = body.isCarbonated;
      expressionAttributeNames["#isCarbonated"] = "isCarbonated";
    }
    if (body.description) {
      updateExpression.push("#description = :description"); 
      expressionAttributeValues[":description"] = body.description;
      expressionAttributeNames["#description"] = "description";
    }

    if (updateExpression.length === 0) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "No valid fields provided for update" }),
      };
    }

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: beverageId },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames, 
      })
    );

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Beverage updated successfully" }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error }),
    };
  }
};

// Create DynamoDB connection
function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  return DynamoDBDocumentClient.from(ddbClient);
}
