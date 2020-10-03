import { Either } from "fp-ts/lib/Either";
import { badReq, ServerError } from "../types";
import { createApiKey, getPayload, CustomerApiKeyCreate, } from "./CustomerApiKey";

describe("createApiKey", () => {
  it("should successfully return new api key for customer", async () => {
    const result = await createApiKey({ customerId: "test " })();
    expect(result._tag).toBe("Right");
  });
});


describe("getPayload", () => {
  function checkerLeft(res: Either<ServerError, CustomerApiKeyCreate>) {
    switch(res._tag) {
      case "Left":
        return expect(res.left).toBe(badReq);
      default:
        return new Error("")
    }
  }
  it("should return bad request if invalid input", async () => {
    const res = await getPayload({})();
    checkerLeft(res);
    const res2 = await getPayload(1)();
    checkerLeft(res2);
    const res3 = await getPayload("")();
    checkerLeft(res3);
    const res4 = await getPayload(true)();
    checkerLeft(res4);
  })
  it("should return CustomerApiKeyCreate if valid input", async () => {
    const res = await getPayload({ customerId: "test" })();
    switch(res._tag) {
      case "Right":
        return expect(res.right).toEqual({ customerId: "test" });
      default:
        return new Error("");
    }
  })

})