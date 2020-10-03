import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { CustomerNotification, CustomerNotificationE } from "./db";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json, mapLeft } from "fp-ts/lib/Either";
import {
  AppM,
  ServerError,
  badReq,
  internalErr,
  NotificationType,
  notificationTypes,
} from "../types";
import { generateToken } from "../utils";
import { NotificationX } from "../types";
import KSUID from "ksuid";

export interface CreateNotificationI {
  notification: NotificationX;
  customerId: string;
}

export function createUid(): AppM<string> {
  return pipe(
    TE.tryCatch(
      () => KSUID.random(),
      () => {
        return internalErr;
      }
    ),
    TE.map((ksuid) => ksuid.string)
  );
}


export function createNotification(props: CreateNotificationI) {
  return pipe(
    createUid(),
    TE.chain((uid) =>
      TE.tryCatch(
        (): Promise<CustomerNotification> => {
          return CustomerNotificationE.update(
            {
              customerId: props.customerId,
              notificationId: uid,
              notification: props.notification,
            },
            {
              returnValues: "all_new",
            }
          ).then((res) => {
            return res.Attributes;
          });
        },
        (err) => {
          return internalErr;
        }
      )
    )
  );
}


export function consNotificationAttempt(
  customerId: string,
  notificationId: string
) {
  return TE.tryCatch(
    (): Promise<CustomerNotification> => {
      return CustomerNotificationE.update(
        {
          customerId,
          notificationId,
        },
        {
          returnValues: "all_new",
        },
        {
          SET: [
            "#attempts = list_append(:attempt, if_not_exists(attempts, :empty_list))",
          ],
          ExpressionAttributeNames: { "#attempts": "attempts" },
          ExpressionAttributeValues: {
            ":attempt": [{ S: new Date().toISOString() }],
            ":empty_list": [],
          },
        }
      ).then((res) => res.Attributes);
    },
    (err) => {
      return internalErr;
    }
  );
}

export function markNotificationReceived(
  customerId: string,
  notificationId: string
) {
  return TE.tryCatch(
    (): Promise<CustomerNotification> => {
      return CustomerNotificationE.update(
        {
          customerId,
          notificationId,
          received: new Date().toISOString()
        },
        {
          returnValues: "all_new",
        },
      ).then((res) => res.Attributes);
    },
    (err) => {
      return internalErr;
    }
  );
}