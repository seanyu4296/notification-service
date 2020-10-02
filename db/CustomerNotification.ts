import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { CustomerNotificationE } from "./db";
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
        console.log('testfail??');
        return internalErr
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
        (): Promise<void> => {
          return CustomerNotificationE.update(
            {
              customerId: props.customerId,
              notificationId: uid,
              notification: props.notification
            },
            {
              returnValues: "all_new",
            }
          ).then((res) => {
            return;
          });
        },
        (err) => {
          console.log(err);
          return internalErr;
        }
      )
    )
  );
}
