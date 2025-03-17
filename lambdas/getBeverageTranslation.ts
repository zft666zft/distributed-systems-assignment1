import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

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
        const targetLanguage = event.queryStringParameters?.language || "fr";
        const validLanguages = ["en", "fr", "de", "es", "zh", "ja", "ko"];
        const beverageIdNumber = Number(beverageId);


        if (!validLanguages.includes(targetLanguage)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: `Invalid target language. Supported languages: ${validLanguages.join(", ")}`,
                }),
            };
        }

        // Get data from DynamoDB
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

        const name = beverageData.Item?.name?.S || "Unknown Beverage";
        const mainText = beverageData.Item?.description?.S || "No description available";
        const translations = beverageData.Item?.translations?.M || {};

        // Check if translation already exists
        if (translations[targetLanguage]?.S) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    id: beverageId,
                    name,
                    translatedText: translations[targetLanguage].S,
                }),
            };
        }

        // Call AWS Translate
        const translateCommand = new TranslateTextCommand({
            Text: mainText,
            SourceLanguageCode: "auto",
            TargetLanguageCode: targetLanguage,
        });

        const translatedResult = await translateClient.send(translateCommand);
        const translatedText = translatedResult.TranslatedText || "";

        // Store translation in DynamoDB
        const updateItemCommand = new UpdateItemCommand({
            TableName: TABLE_NAME,
            Key: { id: { N: String(beverageIdNumber) } },
            UpdateExpression: "SET translations.#lang = :text",
            ExpressionAttributeNames: { "#lang": targetLanguage },
            ExpressionAttributeValues: { ":text": { S: translatedText } },
        });

        await dynamoDBClient.send(updateItemCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                id: beverageId,
                name,
                translatedText,
            }),
        };
    } catch (error: any) {
        console.error("Lambda execution error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Internal Server Error",
                error: error.message || JSON.stringify(error),
            }),
        };
    }
};
