import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { CustomerApiKeyE } from "./db";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json, mapLeft } from "fp-ts/lib/Either";
import { AppM, ServerError, badReq, internalErr } from "../types";
import { generateToken } from "../utils";

export const CustomerApiKeyIO = t.type({
  customerId: t.string,
  apiKey: t.string,
});

export type CustomerApiKey = t.TypeOf<typeof CustomerApiKeyIO>;

export function createApiKey(customerApiKey: CustomerApiKey): AppM<string> {
  return TE.tryCatch(
    (): Promise<string> => {
      return CustomerApiKeyE.update(customerApiKey, {
        returnValues: "all_new",
        conditions: [],
      }).then((res) => {
        return res.Attributes.apiKey
      });
    },
    (err) => {
      return internalErr;
    }
  );
}
