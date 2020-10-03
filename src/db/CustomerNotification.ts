import { CustomerNotification, CustomerNotificationE, NotificationTable } from "./db";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { AppM, internalErr } from "../types";
import { NotificationX } from "../types";
import KSUID from "ksuid";
import { stringType } from "aws-sdk/clients/iam";

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
              shouldNotify: "true",
            },
            {
              returnValues: "all_new",
            }
          ).then((res) => {
            return res.Attributes;
          });
        },
        (error) => {
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
    () => {
      return internalErr;
    }
  );
}

export function markNotificationReceived(
  customerId: string,
  notificationId: string
): AppM<CustomerNotification> {
  return TE.tryCatch(
    (): Promise<CustomerNotification> => {
      return CustomerNotificationE.update(
        {
          customerId,
          notificationId,
          received: new Date().toISOString(),
          $remove: ["shouldNotify"],
        },
        {
          returnValues: "all_new",
        }
      ).then((res) => res.Attributes);
    },
    () => {
      return internalErr;
    }
  );
}

export function getFailedNotifications(): Promise<CustomerNotification[]> {
  return NotificationTable.query("true", {
    index: "GSI1",
  }).then((result) => {
    if (result && result.Items) {
      return result.Items;
    } else {
      return[];
    }
  });
}

export function removeShouldNotify(customerId: string, notificationId: string): Promise<CustomerNotification> {
  return CustomerNotificationE.update(
    {
      customerId,
      notificationId,
      $remove: ["shouldNotify"],
    },
    {
      returnValues: "all_new",
    }
  ).then((res) => res.Attributes);
}