import bodyParser from "body-parser";
import express from "express";
import { runAppM, sendOut } from "./utils";
import * as CustomerApiKey from "./services/CustomerApiKey";
import * as CustomerNotifCallback from "./services/CustomerNotifCallback";
import { pipe } from "fp-ts/lib/function";
import { fold } from "fp-ts/lib/Either";
import { NotificationTable } from "./db/db";

const app: express.Application = express();

app.use(bodyParser.json());
app.post("/create", async function (req, res) {
  let result = await runAppM(CustomerApiKey.createApiKey(req.body));
  sendOut(res, result);
});
app.post("/register", async function (req, res) {
//  let result = await runApp
});

app.post("/test-notification", async function (req, res) {
  const apiKey = req.headers["xendit-auth"] as string; // TODO: fix later do not coerce
  const { notificationType, callbackUrl } =  req.body;
  let result = await runAppM(CustomerNotifCallback.createTestNotification(apiKey, notificationType, callbackUrl))
  sendOut(res, result);
  // let result = await NotificationTable.query("caeb8604c769c347eca2cf7b096097de9bd3dc084c2b6c777539a4fe6339845cfd5d269e13cf41c465d610759b936415", { limit: 1, index: "GSI2" });
  // console.log(result);
});

app.listen(3000, function () {
  console.log("App is listening on port 3000!");
});
