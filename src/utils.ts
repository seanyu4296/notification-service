import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import crypto from "crypto";
import {
  either,
  Either,
  left,
  right,
  fold,
  tryCatch,
  Json,
  mapLeft,
} from "fp-ts/lib/Either";
import {
  AppM,
  badReq,
  internalErr,
  NotificationType,
  NotificationTypeIO,
  NotificationX,
  ServerError,
} from "./types";
import { Response } from "express";

type HttpOut = { status: number; body: Json };

export function toNotificationType(
  str: string
): Either<ServerError, NotificationType> {
  return mapLeft((_) => badReq)(NotificationTypeIO.decode(str));
}

export function sendOut(res: Response, payload: HttpOut) {
  res.status(payload.status);
  res.send(payload.body);
}

export async function runAppM<R>(te: AppM<R>): Promise<HttpOut> {
  const result: Either<ServerError, R> = await te();
  return fold(
    (l: ServerError) => {
      switch (l._tag) {
        case "BadRequest":
          return { status: 400, body: {} };
        case "InternalError":
          return { status: 500, body: {} };
        case "Unauthorized":
          return { status: 401, body: {} };
        case "CallbackTimeout":
          return { status: 408, body: {} };
      }
    },
    (r: R) => {
      return {
        status: 200,
        body: r,
      };
    }
  )(result);
}

export function generateToken(): AppM<string> {
  return TE.tryCatch(
    () =>
      new Promise((resolve, reject) =>
        crypto.randomBytes(48, (err, buffer) => {
          if (!err) {
            resolve(buffer.toString("hex"));
          } else {
            reject(err);
          }
        })
      ),
    () => internalErr
  );
}

export function generateHmacSha256(key: string, payload: string): string {
  return crypto.createHmac("sha256", key).update(payload).digest("base64");
}

export function createFakeNotification(nt: NotificationType): NotificationX {
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
