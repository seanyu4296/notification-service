import bodyParser from "body-parser";
import express from "express";
import { runAppM, sendOut } from "./utils";
import * as CustomerApiKey from "./services/CustomerApiKey";
import * as CustomerNotifCallback from "./services/CustomerNotifCallback";
import * as CustomerNotification from "./services/CustomerNotification";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { fold } from "fp-ts/lib/Either";
import { NotificationTable } from "./db/db";
import { authorize } from "./services/Auth";

const app: express.Application = express();

app.use(bodyParser.json());
app.post("/create", async function (req, res) {
  let result = await runAppM(CustomerApiKey.createApiKey(req.body));
  sendOut(res, result);
});
app.post("/register", async function (req, res) {
  let result = await runAppM(
    pipe(
      authorize(req.headers),
      TE.chain(({ customerId }) =>
        CustomerNotifCallback.registerCallback(customerId, req.body)
      )
    )
  );
  sendOut(res, result);
});

app.post("/test-notification", async function (req, res) {
  let result = await runAppM(
    pipe(
      authorize(req.headers),
      TE.apSecond(CustomerNotifCallback.createTestNotification(req.body))
    )
  );
  sendOut(res, result);
});

app.post("/receive-notification", async function(req, res) {
  let result = await runAppM(
    pipe(
      authorize(req.headers),
      TE.chain(({ customerId, apiKey }) => CustomerNotification.receiveNotification(customerId, apiKey, req.body))
    )
  );
  sendOut(res, result);
});

app.post("/get-notifications", async function(req, res) {

});

app.post("/retry-notification", async function(req, res) {

})

app.listen(3000, function () {
  console.log("App is listening on port 3000!");
});
