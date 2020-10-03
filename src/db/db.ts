import { NotificationType, NotificationX } from "../types";

const { Table, Entity } = require("dynamodb-toolbox");
var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "ap-southeast-1" });
const DynamoDB = require("aws-sdk/clients/dynamodb");
const DocumentClient = new DynamoDB.DocumentClient({
  region: "ap-southeast-1",
  ...(process.env.MOCK_DYNAMODB_ENDPOINT && {
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
    sslEnabled: false,
    region: "local"
  })
});

export const NotificationTable = new Table({
  name: "xendit-notification-dev",

  partitionKey: "pk",
  sortKey: "sk",

  DocumentClient,
  indexes: {
    GSI2: { partitionKey: "apiKey" },
    GSI1: { partitionKey: "shouldNotify" }
  },
});

export const CustomerApiKeyE = new Entity({
  name: "CustomerApiKey",
  attributes: {
    customerId: { partitionKey: true, prefix: "CUSTOMER#" },
    sk: { hidden: true, sortKey: true, default: "APIKEY" },
    apiKey: { type: "string" },
  },
  table: NotificationTable,
});

export const CustomerNotifCallbackE = new Entity({
  name: "CustomerNotifCallback",
  attributes: {
    customerId: { partitionKey: true, prefix: "CUSTOMER#" },
    notificationType: { sortKey: true, prefix: "CBTYPE#" },
    callbackUrl: { type: "string" },
  },
  table: NotificationTable,
});

export interface CustomerNotifCallack {
  notificationType: NotificationType;
  callbackUrl: string;
  entity: string;
  modified: string;
  customerId: string;
  created: string;
}

export const CustomerNotificationE = new Entity({
  name: "CustomerNotification",
  attributes: {
    customerId: { partitionKey: true, prefix: "CUSTOMER#" },
    notificationId: { sortKey: true, prefix: "NOTIF#" },
    notification: { type: "map" },
    attempts: { type: "list" },
    received: { type: "string" },
    shouldNotify: { type: "string"}
  },
  table: NotificationTable,
});
// TODO: notfication should have better validation
export interface CustomerNotification {
  customerId: string;
  notificationId: string;
  notification: NotificationX;
  attempts?: string[];
  received?: string;
  entity: string;
  modified: string;
  created: string;
}
