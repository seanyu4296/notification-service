import { verifyCustomer, getAuthHeader, authorize } from "./Auth";
import { createApiKey } from "./CustomerApiKey";

describe("verifyCustomer", () => {
  it("should successfully return a Right<Customer> if apikey exists", async () => {
    const result = await createApiKey({ customerId: "test" })();
    switch(result._tag) {
      case "Right":
        const customerE = await verifyCustomer(result.right.apiKey)();
        expect(customerE._tag).toBe("Right");
      default:
        return new Error("create api key failed")
    }
  });
  it("should return a Left if apikey does not exist", async () => {
    const customerE = await verifyCustomer("non-existent")();
    expect(customerE._tag).toBe("Left");
  })
});
