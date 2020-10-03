import * as CustomerApiKeyDB from "../db/CustomerApiKey";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { right, left } from "fp-ts/lib/Either";
import {
  AppM,
  unauth,
  Customer,
} from "../types";
import { IncomingHttpHeaders } from "http";

export function verifyCustomer(apiKey: string): AppM<Customer> {
  return TE.tryCatch(
    () => {
      return CustomerApiKeyDB.getApiKey(apiKey);
    },
  () => unauth
  );
}

export function getAuthHeader(headers: IncomingHttpHeaders) {
  let apiKey = headers["xendit-auth"];
  if (typeof apiKey === "string") {
    return right(apiKey);
  } else {
    return left(unauth);
  }
}

export function authorize(headers: IncomingHttpHeaders): AppM<Customer> {
  return pipe(TE.fromEither(getAuthHeader(headers)), TE.chain(verifyCustomer));
}
