import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import {
  CustomerApiKeyE,
  CustomerNotifCallbackE,
  NotificationTable,
} from "../db/db";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Either, Json, mapLeft, right, left } from "fp-ts/lib/Either";
import {
  AppM,
  ServerError,
  badReq,
  internalErr,
  NotificationX,
  NotificationType,
  unauth,
} from "../types";
import Axios from "axios";

function createFakeNotification(nt: NotificationType): NotificationX {
  switch (nt) {
    case "PaymentCreatedNotification":
      return {
        type: "PaymentCreatedNotification",
        payload: {
          id: "fake-id",
          amount: 10000,
        },
      };
    case "PaymentFailedNotification":
      return {
        type: "PaymentFailedNotification",
        payload: {
          id: "fake-id",
          amount: 100000,
          cause: "Insufficient Funds",
        },
      };
  }
}

function toNotificationType(str: string): AppM<NotificationType> {
  switch (str) {
    case "PaymentFailedNotification":
      return TE.fromEither(right(str));
    case "PaymentCreatedNotification":
      return TE.fromEither(right(str));
    default:
      return TE.fromEither(left(badReq));
  }
}

function sendFakeNotification(
  callbackUrl: string,
  notification: NotificationX
): AppM<{}> {
  return TE.tryCatch(
    () => Axios.post(callbackUrl, notification),
    () => internalErr
  );
}

export function createTestNotification(
  apiKey: string,
  notificationType: string,
  callbackUrl: string
): AppM<{}> {
  const fakeNotification: AppM<NotificationX> = pipe(
    notificationType,
    toNotificationType,
    TE.map(createFakeNotification)
  );

  const verifyCustomer: AppM<void> = TE.tryCatch(
    () => {
      return NotificationTable.query(apiKey, {
        limit: 1,
        index: "GSI2",
      }).then((result) => {
        if (result && result.Items && result.Items.length) {
          return;
        } else {
          throw new Error("unauthoizedd");
        }
      });
    },

    () => unauth
  );

  return pipe(
    verifyCustomer,
    TE.chain((_) => fakeNotification),
    TE.chain((notif) => sendFakeNotification(callbackUrl, notif)),
    TE.chain((_) => TE.of({}))
  );
}

// let result = await NotificationTable.query(apiKey, {
//   limit: 1,
//   index: "GSI2",
// });
// if (result && result.Items && result.Items.length) {
//   return;
// } else {
//   throw new Error("unauthoizedd");
// }
