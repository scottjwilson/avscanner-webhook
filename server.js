let app = require("express")();
let xhub = require("express-x-hub");
let bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
require("dotenv").config();

app.use(xhub({ algorithm: "sha1", secret: process.env.APP_SECRET }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
// start server
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

let received_updates = [];

app.get("/", function (req, res) {
  res.send("<pre>" + JSON.stringify(received_updates, null, 2) + "</pre>");
});

// GET route to register the callback URL with Facebook.
app.get("/webhook", (req, res) => {
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

// Creates the endpoint for our webhook
app.post("/webhook", (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// POST route to handle webhook calls.
app.post("/facebook2", async function (req, res) {
  if (!req.isXHubValid()) {
    console.log(
      "Warning - request header X-Hub-Signature not present or invalid"
    );
    res.sendStatus(401);
    return;
  }

  console.log("request header X-Hub-Signature validated");
  try {
    // console.log(req.body);
    const { data, error } = await supabase.from("posts").insert([
      {
        // post_id: entry.post_id,
        // created_at: entry.created_time,
        message: "new live post",
        // message: entry.message,
      },
    ]);

    res.status(200).end();
  } catch (error) {
    console.error(error);
  }
  // Process the Facebook updates here
  received_updates.unshift(req.body);
});
