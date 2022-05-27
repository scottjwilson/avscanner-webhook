const app = require("express")();
const xhub = require("express-x-hub");

// express middleware
const bodyParser = require("body-parser");
app.use(xhub({ algorithm: "sha1", secret: process.env.APP_SECRET }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = 3000;
// start server
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

var received_updates = [];

app.get("/", function (req, res) {
  console.log(req);
  res.send("<pre>" + JSON.stringify(received_updates, null, 2) + "</pre>");
});

// GET route to register the callback URL with Facebook.
app.get("/webhook", (req, res) => {
  console.log(req);
  const VERIFY_TOKEN = "random string";
  // Parse the query params
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// POST route to handle webhook calls.
app.post("/webhook", (req, res) => {
  const entry = req.body.entry[0].changes[0].value;
  const { post_id, created_time, message } = entry;
  try {
    console.log(req.body);

    console.log(message);
  } catch (error) {
    console.error(error);
  }
});
