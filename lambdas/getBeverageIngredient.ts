import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));

    // Extract beverage ID from query string
    const queryParams = event?.queryStringParameters;
    const beverageId = queryParams?.beverageId ? parseInt(queryParams.beverageId) : undefined;

    if (!beverageId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing beverageId in query string" }),
      };
    }

    // Ensure correct permissions and structure
    console.log(`Fetching ingredients for beverage ID: ${beverageId}`);

    // Query the BeverageIngredients table
    const ingredientsOutput = await ddbDocClient.send(
      new QueryCommand({
        TableName: process.env.INGREDIENTS_TABLE_NAME,
        KeyConditionExpression: "beverageId = :b",
        ExpressionAttributeValues: { ":b": beverageId },
      })
    );

    if (!ingredientsOutput.Items || ingredientsOutput.Items.length === 0) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "No ingredients found for this beverage" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: ingredientsOutput.Items }),
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
