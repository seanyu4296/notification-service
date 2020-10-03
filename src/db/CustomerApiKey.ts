import * as t from "io-ts";
import { CustomerApiKeyE, NotificationTable } from "./db";
import * as TE from "fp-ts/lib/TaskEither";
import { AppM, internalErr, Customer } from "../types";
import { none, Option, some } from "fp-ts/lib/Option";

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
      }).then((res: any) => {
        return res.Attributes.apiKey;
      });
    },
    () => {
      return internalErr;
    }
  );
}

export function getApiKey(apiKey: string): Promise<Customer> {
  return NotificationTable.query(apiKey, {
    limit: 1,
    index: "GSI2",
  }).then((result: any) => {
    if (result && result.Items && result.Items.length >= 1) {
      return result.Items[0];
    } else {
      throw new Error("unauthorized");
    }
  });
}

export function getApiKeyByCustomerIdOpt(
  customerId: string
): Promise<Option<string>> {
  return CustomerApiKeyE.get({ customerId }, {}).then((res: any) => {
    if (res && res.Item) {
      return some(res.Item.apiKey);
    }
    return none;
  });
}

// use throw for now
export function getApiKeyByCustomerId(customerId: string): Promise<string> {
  return CustomerApiKeyE.get({ customerId }, {}).then((res: any) => {
    if (res && res.Item) {
      return res.Item.apiKey;
    } else {
      throw new Error("no api key");
    }
  });
}
