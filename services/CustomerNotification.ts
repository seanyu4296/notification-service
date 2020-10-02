import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import * as CustomerNotificationDB from "../db/CustomerNotification";
import * as E from "fp-ts/lib/Either";
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
  callbackTimeout,
  NotificationTypeIO,
  PaymentCreatedNotifPayloadIO,
  PaymentFailedNotifPayloadIO,
  PaymentFailedNotifPayload,
  PaymentCreatedNotif,
  PaymentCreatedNotifPayload,
} from "../types";
import Axios from "axios";
import { toNotificationType } from "../utils";

export function getNotificationX(payload: Json): AppM<NotificationX> {
  if (payload) {
    let p = payload as any;
    return TE.fromEither(
      pipe(
        toNotificationType(p.type || ""),
        E.chain((notifType): Either<ServerError, NotificationX> => {
          switch (notifType) {
            case "PaymentFailedNotification":
              return E.bimap(
                (_) => badReq,
                (r: PaymentFailedNotifPayload) => ({
                  type: notifType,
                  payload: r,
                })
              )(PaymentFailedNotifPayloadIO.decode(p.payload));
            case "PaymentCreatedNotification":
              return E.bimap(
                (_) => badReq,
                (r: PaymentCreatedNotifPayload) => ({
                  type: notifType,
                  payload: r,
                })
              )(PaymentCreatedNotifPayloadIO.decode(p.payload));
          }
        })
      )
    );
  }
  return TE.left(badReq);
}

export function receiveNotification(
  customerId: string,
  payload: Json
): AppM<void> {
  return pipe(
    getNotificationX(payload),
    TE.chain(notification => CustomerNotificationDB.createNotification({ customerId, notification}))
  )
}
