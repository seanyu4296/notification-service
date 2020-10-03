import { CustomerNotifCallack, CustomerNotifCallbackE } from "./db";
import * as TE from "fp-ts/lib/TaskEither";
import {
  AppM,
  internalErr,
  NotificationType,
} from "../types";
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
      }).then((res: any) => {
        return;
      });
    },
    () => {
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
        (res: any) => {
          if(res && res.Item) {
            return some(res.Item)
          }
          return none;
        }
      );
    },
    () => {
      return internalErr;
    }
  );
}
