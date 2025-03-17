import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({
    region: process.env.AWS_REGION || "eu-west-1",
});

const translateClient = new TranslateClient({
    region: process.env.AWS_REGION || "eu-west-1",
});

  

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const beverageId = event.pathParameters?.beverageId;
        const validLanguages = ["en", "fr", "de", "es", "zh", "ja", "ko"];
        const targetLanguage = event.queryStringParameters?.language || "fr";

        const beverageIdNumber = Number(beverageId);
        if (!validLanguages.includes(targetLanguage)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    message: `Invalid target language. Supported languages: ${validLanguages.join(", ")}` 
                }),
            };
        }


        // Fetch beverage from DynamoDB
        const getItemCommand = new GetItemCommand({
            TableName: TABLE_NAME,
            Key: { id: { N: String(beverageIdNumber) } }, 
        });

        const beverageData = await dynamoDBClient.send(getItemCommand);

        if (!beverageData.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Beverage not found" }),
            };
        }

        const mainText = beverageData.Item?.description?.S || "No description available";

        const name = beverageData.Item?.name?.S || "Unknown Beverage";


        // Translate the mainText
        const translateCommand = new TranslateTextCommand({
            Text: mainText,
            SourceLanguageCode: "en",
            TargetLanguageCode: targetLanguage,
        });

        const translatedResult = await translateClient.send(translateCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: beverageId,
                name: beverageData.Item.name.S,
                translatedText: translatedResult.TranslatedText,
            }),
        };
    } catch (error: any) {
        console.error("Lambda execution error:", error);

      return {
    statusCode: 500,
    body: JSON.stringify({ 
        message: "Internal Server Error", 
        error: error.message || JSON.stringify(error) 
    }),
};

    }
};
