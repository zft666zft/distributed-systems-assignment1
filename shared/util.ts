import { marshall } from "@aws-sdk/util-dynamodb";
import { Beverage, BeverageIngredient } from "./types";

type Entity = Beverage | BeverageIngredient;

export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((item) => generateItem(item));
};
