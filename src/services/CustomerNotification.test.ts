import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { Json } from "fp-ts/lib/Either";
import { createFakeNotification } from "../utils";
import { createApiKey } from "./CustomerApiKey";
import { registerCallback } from "./CustomerNotifCallback";
import {
  attemptSendFailNotification,
  attemptSendNotification,
  getNotificationX,
  sendNotification,
} from "./CustomerNotification";

const mockAxios = new MockAdapter(axios);

afterEach(() => {
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
  let fakeCallbackUrl = "http://test.com";
  let fakeApiKey = "test-api-key";
  it("should return a Right when it succeeds", async () => {
    mockAxios.onPost(fakeCallbackUrl).reply(200, "");
    const result = await sendNotification(
      createFakeNotification("PaymentFailedNotification"),
      fakeCallbackUrl,
      fakeApiKey
    )();
    expect(result._tag).toBe("Right");
  });
  it("should return a Left when sending timeouts", async () => {
    const result = await sendNotification(
      createFakeNotification("PaymentFailedNotification"),
      fakeCallbackUrl,
      fakeApiKey
    )();
    expect(result._tag).toBe("Left");
  });
});

describe("Send notification flow", () => {
  it("should mark a notification received if notification is successfully acknowledged", async () => {
    const apiKey = await createApiKey({ customerId: "test "})();
    const regCallback = await registerCallback("test", { type: "PaymentFailedNotification", callbackUrl: "http://test.com" });
    
    // console.log(result);
    // const result = await attemptSendNotification(
    //   "",
    //   "",
    //   "",
    //   "",
    //   createFakeNotification("PaymentFailedNotification"),
    //   []
    // )();
    // console.log(result);
  });
  it("should not send a notification when it reached its attempt limit", async () => {});
});
