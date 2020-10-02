import { Task } from "fp-ts/lib/Task";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { CustomerApiKeyE } from "../db/db";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Json, mapLeft } from "fp-ts/lib/Either";
import { AppM, ServerError, badReq, internalErr } from "../types";
import { generateToken } from "../utils";

export const CustomerApiKeyIO = t.type({
  customerId: t.string,
  apiKey: t.string,
});
export const CustomerApiKeyCreateIO = t.type({
  customerId: t.string,
});

type CustomerApiKey = t.TypeOf<typeof CustomerApiKeyIO>;
type CustomerApiKeyCreate = t.TypeOf<typeof CustomerApiKeyCreateIO>;

export function createApiKey(
  payload: Json
): AppM<{ apiKey: string }> {
  return pipe(
    payload,
    (payload) =>
      TE.fromEither(
        mapLeft((_) => badReq)(CustomerApiKeyCreateIO.decode(payload))
      ),
    TE.chain(({ customerId }: CustomerApiKeyCreate) => {
      return pipe(
        generateToken(),
        TE.chain((token) => TE.of({ customerId, apiKey: token }))
      );
    }),
    TE.chain((customerApiKey) => {
      return TE.tryCatch(
        // TODO: have better validation
        (): Promise<{ Attributes: { apiKey: string } }> => {
          return CustomerApiKeyE.update(customerApiKey, {
            returnValues: "all_new",
            conditions: []
          });
        },
        (err) => {
          console.log(err);
          return internalErr;
        }
      );
    }),
    TE.map((entity) => {
      return {
        apiKey: entity.Attributes.apiKey
      }
    })
  );
}
