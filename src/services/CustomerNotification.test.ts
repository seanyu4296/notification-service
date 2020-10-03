import mockAxios from "jest-mock-axios";
import { Json } from "fp-ts/lib/Either";
import { createFakeNotification } from "../utils";
import { getNotificationX, sendNotification } from "./CustomerNotification";

afterEach(() => {
  // cleaning up the mess left behind the previous test
  mockAxios.reset();
});

describe("getNotificationX", () => {
  it("should not accept invalid Json", async () => {
    const result = await getNotificationX({})();
    expect(result._tag).toBe("Left");

    const result2 = await getNotificationX({ test: "1" })();
    expect(result2._tag).toBe("Left");

    const result3 = await getNotificationX(4)();
    expect(result3._tag).toBe("Left");

    const result4 = await getNotificationX("Random string")();
    expect(result4._tag).toBe("Left");

    const result5 = await getNotificationX(null)();
    expect(result5._tag).toBe("Left");
  });
  it("should accept valid notification types", async () => {
    const result = await getNotificationX(
      createFakeNotification("PaymentCreatedNotification") as any
    )();
    expect(result._tag).toBe("Right");
    const result2 = await getNotificationX(
      createFakeNotification("PaymentFailedNotification") as any
    )();
    expect(result2._tag).toBe("Right");
  });
});

describe("sendNotification", () => {
  it("should return a Right when it succeeds", async () => {
    let thenFn1 = jest.fn();
    let fakeCallbackUrl = "http://test.com";
    let fakeApiKey = "test-api-key";
    mockAxios.mockResponse({ status: 200, data: {} });
    const promise = sendNotification(
      createFakeNotification("PaymentFailedNotification"),
      fakeCallbackUrl,
      fakeApiKey
    )();
    expect(mockAxios.post).toHaveBeenCalledWith("/web-service-url/");

    // simulating a server response
    const responseObj = { data: "server says hello!" };
    mockAxios.mockResponse(responseObj);
    const result = await promise;

    expect(result._tag).toEqual("Right")
  });
  it("should return a Left when sending timeouts", async () => {});
});

describe("attemptSendNotification", () => {
  it("should mark a notification received if notification is successfully acknowledged", async () => {});
  it("should not send a notification when it reached its attempt limit", async () => {});
});
