import express from "express";
import bodyParser from "body-parser";

const app: express.Application = express();

app.use(bodyParser.json());

app.all("*", (req, res) => {
  console.log("HEADERS: ", req.headers);
  console.log("BODY: ", req.body);
  res.status(200);
  res.send();
})

app.listen(3001, function () {
  console.log("App is listening on port 3001!");
});
