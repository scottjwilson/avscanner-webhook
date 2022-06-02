const app = require("express")();
const xhub = require("express-x-hub");

require("dotenv").config();

// Import Supabase Client
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// express middleware
const bodyParser = require("body-parser");

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
app.get("/facebook", (req, res) => {
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
app.post("/facebook", async function (req, res) {
  if (!req.isXHubValid()) {
    console.log(
      "Warning - request header X-Hub-Signature not present or invalid"
    );
    res.sendStatus(401);
    return;
  }

  console.log("request header X-Hub-Signature validated");
  // Process the Facebook updates here
  received_updates.unshift(req.body);
});
