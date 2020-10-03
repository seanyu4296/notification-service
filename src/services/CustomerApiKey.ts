import * as t from "io-ts";
import * as CustomerApiKeyDB from "../db/CustomerApiKey";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Json, mapLeft } from "fp-ts/lib/Either";
import { AppM, badReq } from "../types";
import { generateToken } from "../utils";

export const CustomerApiKeyCreateIO = t.type({
  customerId: t.string,
});

type CustomerApiKeyCreate = t.TypeOf<typeof CustomerApiKeyCreateIO>;

export function getPayload(payload: Json): AppM<CustomerApiKeyCreate> {
  return TE.fromEither(
    mapLeft((_) => badReq)(CustomerApiKeyCreateIO.decode(payload))
  );
}

export function generateCreateApiKey({
  customerId,
}: CustomerApiKeyCreate): AppM<CustomerApiKeyDB.CustomerApiKey> {
  return pipe(
    generateToken(),
    TE.chain((token) => TE.of({ customerId, apiKey: token }))
  );
}

export function createApiKey(payload: Json): AppM<{ apiKey: string }> {
  return pipe(
    payload,
    getPayload,
    TE.chain(generateCreateApiKey),
    TE.chain(CustomerApiKeyDB.createApiKey),
    TE.map((apiKey) => {
      return {
        apiKey,
      };
    })
  );
}
