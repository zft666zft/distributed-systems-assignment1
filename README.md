## Serverless REST Assignment - Distributed Systems.

__Name:__ Futong Zhu

__Demo:__ [link to  YouTube video demonstration](https://youtu.be/T_zpP0bgn7A)

### Context.

Context: Beverage 

Table item attributes:
+ `id` - number (Partition Key)  
+ `name` - string (Sort Key)  
+ `isCarbonated` - boolean  
+ `description` - string  
+ `price` - number  
+ `isActive` - boolean  
+ `translations` - object 
 
Context: Beverage Ingredients

Table item attributes:
+ `beverageId` - number (Partition Key)  
+ `ingredientName` - string (Sort Key)  
+ `quantity` - string  
+ `notes` - string  
 

### App API endpoints.


+ POST /beverages
 Add a new beverage item to the catalog. Requires IAM authorization.
+ GET /beverages
Retrieve all beverage items in the catalog.
+ GET /beverages/{beverageId}
Retrieve a specific beverage by its beverageId.
+ PUT /beverages/{beverageId}
Update details of a beverage by its beverageId. Requires IAM authorization.
+ GET /beverages/ingredients?beverageId={id}
Retrieve all ingredients associated with a specific beverage ID.
+ GET /beverages/{beverageId}/translate?language={langCode}
Translate the description field of a beverage to a specified language (e.g., fr, zh, de, etc.). Cached in DynamoDB.



### Features.

#### Translation persistence 

We implemented translation persistence using AWS Translate and DynamoDB. When a client requests a translation of a beverage description to a target language (e.g., fr, zh, de), the system will check if a cached translation already exists in the translations field of the beverage item.If not found, it translates using AWS Translate and persists the result back into the translations map within the item.

**Structure of a translated beverage item:**

+ id - number (Partition Key)
+ name - string (Sort Key)
+ isCarbonated - boolean
+ description - string
+ price - number
+ isActive - boolean
+ translations - map<string, string>

  Example:  
  ```json
  {
    "fr": "Eau gazeuse",
    "de": "Sprudelwasser",
    "zh": "苏打水"
  }
  ```

#### Custom L2 Construct (if completed)

A reusable **LambdaConstruct** was implemented to streamline the creation of Lambda functions. This custom L2 construct standardizes common configuration parameters, including runtime, handler path, environment variables, and source code location.

**Construct Input props object:**
~~~ts
export interface LambdaConstructProps {
  functionName: string;
  handler: string;
  environment?: { [key: string]: string };
}
~~~

**Construct public properties:**
~~~ts
export class LambdaConstruct extends Construct {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    ...
  }
}
~~~









