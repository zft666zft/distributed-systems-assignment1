import { Beverage, BeverageIngredient } from "../shared/types";

export const beverages: Beverage[] = [
  {
    id: 1001,
    name: "Coca-Cola",
    isCarbonated: true,
    description: "A sweet carbonated beverage by The Coca-Cola Company.",
    price: 1.5,
    isActive: true,
    translations: {} // Add empty translation object for caching
  },
  {
    id: 1002,
    name: "Green Tea",
    isCarbonated: false,
    description: "A soothing hot beverage made from Camellia sinensis leaves.",
    price: 2.0,
    isActive: true,
    translations: {}
  },
  {
    id: 1003,
    name: "Americano Coffee",
    isCarbonated: false,
    description: "A style of coffee prepared by brewing espresso with hot water.",
    price: 2.5,
    isActive: true,
    translations: {}
  },
  {
    id: 1004,
    name: "Orange Juice",
    isCarbonated: false,
    description: "Freshly squeezed orange juice with no added sugar.",
    price: 3.0,
    isActive: false,
    translations: {}
  },
];

export const beverageIngredients: BeverageIngredient[] = [
  {
    beverageId: 1001,
    ingredientName: "Carbonated Water",
    quantity: "500ml",
    notes: "Base for the beverage",
  },
  {
    beverageId: 1001,
    ingredientName: "Sugar",
    quantity: "40g",
    notes: "Sweetener",
  },
  {
    beverageId: 1002,
    ingredientName: "Green Tea Leaves",
    quantity: "2 tsp",
    notes: "Brew with hot water",
  },
  {
    beverageId: 1004,
    ingredientName: "Orange Pulp",
    quantity: "250ml",
    notes: "Freshly squeezed",
  },
];
