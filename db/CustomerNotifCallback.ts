import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { CustomerNotifCallack, CustomerNotifCallbackE } from "./db";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json, mapLeft } from "fp-ts/lib/Either";
import {
  AppM,
  ServerError,
  badReq,
  internalErr,
  NotificationType,
} from "../types";
import { generateToken } from "../utils";
import { none, Option, some } from "fp-ts/lib/Option";

export interface RegisterCallbackI {
  notificationType: NotificationType;
  callbackUrl: string;
  customerId: string;
}

export function registerCallback(payload: RegisterCallbackI): AppM<void> {
  return TE.tryCatch(
    (): Promise<void> => {
      return CustomerNotifCallbackE.update(payload, {
        returnValues: "none",
        conditions: [],
      }).then((_) => {
        return;
      });
    },
    (err) => {
      return internalErr;
    }
  );
}

export function getCallbackUrl(
  customerId: string,
  notificationType: NotificationType
): AppM<Option<CustomerNotifCallack>> {
  return TE.tryCatch(
    (): Promise<Option<CustomerNotifCallack>> => {
      return CustomerNotifCallbackE.get({ customerId, notificationType }).then(
        (res) => {
          if(res && res.Item) {
            return some(res.Item)
          }
          return none;
        }
      );
    },
    (err) => {
      return internalErr;
    }
  );
}
