import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";

// Notification Types

export type NotificationType =
  | "PaymentFailedNotification"
  | "PaymentCreatedNotification";
export const notificationTypes: NotificationType[] = [
  "PaymentFailedNotification",
  "PaymentCreatedNotification",
];
export const PaymentCreatedNotifPayloadIO = t.type({
  id: t.string,
  amount: t.number,
});

export type PaymentCreatedNotifPayload = t.TypeOf<
  typeof PaymentCreatedNotifPayloadIO
>;

export interface PaymentCreatedNotif {
  type: "PaymentCreatedNotification";
  payload: PaymentCreatedNotifPayload;
}

export const PaymentFailedNotifPayloadIO = t.type({
  id: t.string,
  cause: t.string,
  amount: t.number,
});

export type PaymentFailedNotifPayload = t.TypeOf<
  typeof PaymentFailedNotifPayloadIO
>;

export interface PaymentFailedNotif {
  type: "PaymentFailedNotification";
  payload: PaymentFailedNotifPayload;
}

export type NotificationX = PaymentCreatedNotif | PaymentFailedNotif;

// App Types
export interface BadRequest {
  _tag: "BadRequest";
}

export interface InternalError {
  _tag: "InternalError";
}

export interface Unauthorized {
  _tag: "Unauthorized";
}

export const badReq: ServerError = {
  _tag: "BadRequest",
};
export const internalErr: ServerError = {
  _tag: "InternalError",
};
export const unauth: ServerError = {
  _tag: "Unauthorized",
};

export type ServerError = BadRequest | InternalError | Unauthorized;

export type AppM<O> = TaskEither<ServerError, O>;
