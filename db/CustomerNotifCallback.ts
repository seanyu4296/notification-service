import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { CustomerNotifCallbackE } from "./db";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json, mapLeft } from "fp-ts/lib/Either";
import { AppM, ServerError, badReq, internalErr, NotificationType } from "../types";
import { generateToken } from "../utils";


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