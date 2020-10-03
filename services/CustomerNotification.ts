import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import * as CustomerNotificationDB from "../db/CustomerNotification";
import * as CustomerNotifCallbackDB from "../db/CustomerNotifCallback";
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
import { generateHmacSha256, toNotificationType } from "../utils";
import { CustomerNotification } from "../db/db";

// TODO: this can have a better generic validator/decoder
export function getNotificationX(payload: Json): AppM<NotificationX> {
  if (payload) {
    let p = (payload || {}) as any;
    return TE.fromEither(
      pipe(
        toNotificationType(p.type || ""),
        E.chain(
          (notifType): Either<ServerError, NotificationX> => {
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
          }
        )
      )
    );
  }
  return TE.left(badReq);
}
// getnotificationcallback url
// add an attempt
// try to send (create a function for this add a secure header thing)
// -- if success -- mark as received
// -- if failure -- throw away
function sendNotification(
  notification: NotificationX,
  callbackUrl: string,
  apiKey: string,
): Task<Either<string, void>> {
  return TE.tryCatch(
    () => Axios.post(callbackUrl, notification, {
      headers: {
        'X-Xendit-Hmac-SHA256': generateHmacSha256(apiKey, JSON.stringify(notification))
      }
    }),
    (_) => "failed to send notifcation"
  );
}

function attemptSendNotification(
  apiKey: string,
  customerId: string,
  notificationId: string,
  callbackUrl: string,
  notification: NotificationX
): AppM<{}> {
  return pipe(
    CustomerNotificationDB.consNotificationAttempt(customerId, notificationId),
    TE.chain(() => {
      return pipe(
        sendNotification(notification, callbackUrl, apiKey),
        T.chain((result) => {
          switch (result._tag) {
            case "Left":
              return TE.right({});
            case "Right":
              return CustomerNotificationDB.markNotificationReceived(
                customerId,
                notificationId
              );
          }
        })
      );
    })
  );
}

export function receiveNotification(
  customerId: string,
  apiKey: string,
  payload: Json
): AppM<{}> {
  return pipe(
    getNotificationX(payload),
    TE.chain((notification) =>
      CustomerNotificationDB.createNotification({ customerId, notification })
    ),
    TE.chain(({ customerId, notificationId, notification }) => {
      return pipe(
        CustomerNotifCallbackDB.getCallbackUrl(customerId, notification.type),
        TE.chain((callbackO) => {
          switch (callbackO._tag) {
            case "None":
              // TODO: not sure if this is correct no callback == failed?? or should we stil save it?
              return TE.left(badReq);
            case "Some":
              return TE.right(callbackO.value.callbackUrl);
          }
        }),
        TE.chain((callbackUrl) => {
          return attemptSendNotification(
            apiKey,
            customerId,
            notificationId,
            callbackUrl,
            notification
          );
        })
      );
    })
  );
}
