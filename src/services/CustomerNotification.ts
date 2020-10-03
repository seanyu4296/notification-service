import { Task } from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as A from "fp-ts/lib/Array";
import * as T from "fp-ts/lib/Task";
import * as CustomerNotificationDB from "../db/CustomerNotification";
import * as CustomerNotifCallbackDB from "../db/CustomerNotifCallback";
import * as CustomerApiKeyDB from "../db/CustomerApiKey";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { Either, Json } from "fp-ts/lib/Either";
import {
  AppM,
  ServerError,
  badReq,
  NotificationX,
  PaymentCreatedNotifPayloadIO,
  PaymentFailedNotifPayloadIO,
  PaymentFailedNotifPayload,
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

function sendNotification(
  notification: NotificationX,
  callbackUrl: string,
  apiKey: string
): Task<Either<string, void>> {
  return TE.tryCatch(
    () =>
      Axios.post(callbackUrl, notification, {
        timeout: 4000,
        headers: {
          "X-Xendit-Hmac-SHA256": generateHmacSha256(
            apiKey,
            JSON.stringify(notification)
          ),
        },
      }),
    (_) => "failed to send notification"
  );
}

function attemptSendNotification(
  apiKey: string,
  customerId: string,
  notificationId: string,
  callbackUrl: string,
  notification: NotificationX,
  attempts?: string[]
): AppM<CustomerNotification> {
  // better ran before everything??
  if (Array.isArray(attempts) && attempts.length > 5) {
    return TE.fromTask(() =>
      CustomerNotificationDB.removeShouldNotify(customerId, notificationId)
    );
  }
  return pipe(
    CustomerNotificationDB.consNotificationAttempt(customerId, notificationId),
    TE.chain((customerNotif) => {
      return pipe(
        sendNotification(notification, callbackUrl, apiKey),
        T.chain((result) => {
          switch (result._tag) {
            case "Left":
              return TE.right(customerNotif);
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
    TE.chain(({ customerId, notificationId, notification, attempts }) => {
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
            notification,
            attempts
          );
        })
      );
    })
  );
}

export function getFailedNotifications(): Task<
  Either<{}, CustomerNotification[]>
> {
  return TE.tryCatch(
    () => CustomerNotificationDB.getFailedNotifications(),
    () => {
      return {};
    }
  );
}

export function attemptSendFailNotification(
  customerNotification: CustomerNotification
): Task<Either<string,CustomerNotification>> {
  return pipe(
    TE.tryCatch(
      () =>
        CustomerApiKeyDB.getApiKeyByCustomerId(customerNotification.customerId),
      () => "no api key for customerId"
    ),
    TE.chain((apiKey) => {
      return pipe(
        TE.mapLeft((_) => "no callbackUrl")(
          CustomerNotifCallbackDB.getCallbackUrl(
            customerNotification.customerId,
            customerNotification.notification.type
          )
        ),
        TE.chain((callbackO) => {
          switch (callbackO._tag) {
            case "None":
              return TE.left("no callbackUrl");
            case "Some":
              return TE.right(callbackO.value.callbackUrl);
          }
        }),
        TE.chain((callbackUrl) => {
          return TE.mapLeft((_) => "failed send notification")(
            attemptSendNotification(
              apiKey,
              customerNotification.customerId,
              customerNotification.notificationId,
              callbackUrl,
              customerNotification.notification,
              customerNotification.attempts,
            )
          );
        })
      );
    })
  );
}

export function resendNotifications(): Task<Either<{}, Either<string, CustomerNotification>[]>> {
  return pipe(
    getFailedNotifications(),
    TE.chain((notifications) => {
      return TE.fromTask(
        A.sequence(T.task)(
          notifications.map((notification) =>
            attemptSendFailNotification(notification)
          )
        )
      );
    })
  );
}
