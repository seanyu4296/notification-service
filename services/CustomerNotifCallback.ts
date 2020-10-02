import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
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
} from "../types";
import Axios from "axios";
import { toNotificationType } from "../utils";

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



// TODO: modify this later on from send notification = send notification => catch if it fails and do something => do something if it succeeds
function sendFakeNotification(props: {
  notification: NotificationX;
  callbackUrl: string;
}): AppM<{}> {
  return TE.tryCatch(
    () => Axios.post(props.callbackUrl, props.notification),
    () => callbackTimeout
  );
}

const CreateTestNoificationIO = t.type({
  notificationType: t.string,
  callbackUrl: t.string,
});

type CreateTestNoification = t.TypeOf<typeof CreateTestNoificationIO>;

export function createTestNotification(payload: Json): AppM<{}> {
  const p: Either<ServerError, CreateTestNoification> = mapLeft((_) => badReq)(
    CreateTestNoificationIO.decode(payload)
  );
  const fakeNotification: Either<
    ServerError,
    { notification: NotificationX; callbackUrl: string }
  > = pipe(
    p,
    E.chain(({ notificationType, callbackUrl }) => {
      return pipe(
        toNotificationType(notificationType),
        E.map((notifType) => {
          return {
            notification: createFakeNotification(notifType),
            callbackUrl,
          };
        })
      );
    })
  );

  return pipe(
    TE.fromEither(fakeNotification),
    TE.chain(sendFakeNotification),
    TE.apSecond(TE.of({}))
  );
}

// Register Callback
const RegisterCallbackIO = t.type({
  callbackUrl: t.string,
  notificationType: NotificationTypeIO,
});

type RegisterCallback = t.TypeOf<typeof RegisterCallbackIO>;

export function getRegisterCallback(
  payload: Json
): Either<ServerError, RegisterCallback> {
  return mapLeft((_) => badReq)(RegisterCallbackIO.decode(payload));
}

export function registerCallback(customerId: string, payload: Json) {
  return pipe(
    TE.fromEither(getRegisterCallback(payload)),
    TE.chain(({ callbackUrl, notificationType }) =>
      CustomerNotifCallbackDB.registerCallback({
        callbackUrl,
        notificationType,
        customerId,
      })
    )
  );
}

// TODO: create an authorization function that returns customer id
// TODO: a service can send a notification
