const { Table, Entity } = require("dynamodb-toolbox");
var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "ap-southeast-1" });
const DynamoDB = require("aws-sdk/clients/dynamodb");
const DocumentClient = new DynamoDB.DocumentClient({
  region: "ap-southeast-1",
});

// Instantiate a table
export const NotificationTable = new Table({
  // Specify table name (used by DynamoDB)
  name: "xendit-notification-dev",

  // Define partition and sort keys
  partitionKey: "pk",
  sortKey: "sk",

  // Add the DocumentClient
  DocumentClient,
  indexes: {
    GSI2: { partitionKey: 'apiKey' },
  }
});

export const CustomerApiKeyE = new Entity({
  name: "CustomerApiKey",
  attributes: {
    customerId: { partitionKey: true, prefix: "CUSTOMER#" },
    sk: { hidden: true, sortKey: true, default: "APIKEY"},
    apiKey: { type: "string" },
  },
  table: NotificationTable,
});

export const CustomerNotifCallbackE = new Entity({
  name: "CustomerNotifCallback",
  attributes: {
    customerId: { partitionKey: true, prefix: "CUSTOMER#" },
    notificationType: { sortKey: true, prefix: "CBTYPE#" },
    callbackUrl: { type: "string", alias: "cbUrl" },
  },
  table: NotificationTable,
});

export const CustomerNotificationE = new Entity({
  name: "CustomerNotification",
  attributes: {
    customerId: { partitionKey: true, prefix: "CUSTOMER#" },
    notificationId: { sortKey: true, prefix: "NOTIF#" },
    payload: { type: "map" },
  },
  table: NotificationTable,
});
