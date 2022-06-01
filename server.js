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

var received_updates = [];

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

// POST route to handle webhook calls.
app.post("/webhook", async function (req, res) {
  const entry = req.body.entry;
  //   const { post_id, created_time, message } = entry;
  console.log("from facebook", entry);
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

    if (data) {
      console.log("supabase", data);
    }

    if (error) {
      console.log("supabase error", error);
    }

    res.status(200).end();
  } catch (error) {
    console.error(error);
  }
});
