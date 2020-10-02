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
  callbackTimeout,
  Customer,
} from "../types";
import Axios from "axios";

function verifyCustomer(apiKey: string): AppM<Customer> {
  return TE.tryCatch(
    () => {
      return NotificationTable.query(apiKey, {
        limit: 1,
        index: "GSI2",
      }).then((result) => {
        if (result && result.Items && result.Items.length >= 1) {
          return result.Items[0];
        } else {
          throw new Error("unauthorized");
        }
      });
    },
    () => unauth
  );
}

export function getAuthHeader(headers: { [key: string]: string | string[] }) {
  let apiKey = headers["xendit-auth"];
  if (typeof apiKey === "string") {
    return right(apiKey);
  } else {
    return left(unauth);
  }
}

export function authorize(headers: {
  [key: string]: string | string[];
}): AppM<Customer> {
  return pipe(TE.fromEither(getAuthHeader(headers)), TE.chain(verifyCustomer));
}
