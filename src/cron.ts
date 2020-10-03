import { map } from "fp-ts/lib/Either";
import cron from "node-cron";
import { getApiKeyByCustomerId } from "./db/CustomerApiKey";
import { getFailedNotifications } from "./db/CustomerNotification";
import { resendNotifications } from "./services/CustomerNotification";

async function main() {
  const result = await resendNotifications()();
  map(res => console.log(res))(result);

}
main();
// cron.schedule("*/5 * * * *", main);
