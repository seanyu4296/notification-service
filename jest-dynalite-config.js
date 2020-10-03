module.exports = {
  basePort: 8000,
  tables: [
    {
      AttributeDefinitions: [
        {
          AttributeName: "apiKey",
          AttributeType: "S",
        },
        {
          AttributeName: "pk",
          AttributeType: "S",
        },
        {
          AttributeName: "shouldNotify",
          AttributeType: "S",
        },
        {
          AttributeName: "sk",
          AttributeType: "S",
        },
      ],
      TableName: "xendit-notification-dev",
      KeySchema: [
        {
          AttributeName: "pk",
          KeyType: "HASH",
        },
        {
          AttributeName: "sk",
          KeyType: "RANGE",
        },
      ],
      TableStatus: "ACTIVE",
      CreationDateTime: 1601624289.706,
      ProvisionedThroughput: {
        NumberOfDecreasesToday: 0,
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      TableSizeBytes: 892,
      ItemCount: 4,
      TableArn:
        "arn:aws:dynamodb:ap-southeast-1:560397428138:table/xendit-notification-dev",
      TableId: "b1c69498-2e6f-46bb-85bf-ca63fece25a6",
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI2",
          KeySchema: [
            {
              AttributeName: "apiKey",
              KeyType: "HASH",
            },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
          IndexStatus: "ACTIVE",
          ProvisionedThroughput: {
            NumberOfDecreasesToday: 0,
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          IndexSizeBytes: 196,
          ItemCount: 1,
          IndexArn:
            "arn:aws:dynamodb:ap-southeast-1:560397428138:table/xendit-notification-dev/index/GSI2",
        },
        {
          IndexName: "GSI1",
          KeySchema: [
            {
              AttributeName: "shouldNotify",
              KeyType: "HASH",
            },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
          IndexStatus: "ACTIVE",
          ProvisionedThroughput: {
            NumberOfDecreasesToday: 0,
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          IndexSizeBytes: 260,
          ItemCount: 1,
          IndexArn:
            "arn:aws:dynamodb:ap-southeast-1:560397428138:table/xendit-notification-dev/index/GSI1",
        },
      ],
    },
  ],
};
