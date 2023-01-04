import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Client } from "pg";
import { RowDescriptionMessage } from "pg-protocol/dist/messages";
import { getEnvVarOrFail } from "./support/envVarUtils";
import { setupDBClientConfig } from "./support/setupDBClientConfig";
//hey its katrinas
//comment for push
dotenv.config(); //Read .env file lines as though they were env vars.

const dbClientConfig = setupDBClientConfig();
const client = new Client(dbClientConfig);

//Configure express routes
const app = express();

app.use(express.json()); //add JSON body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

app.get("/", async (req, res) => {
  res.json({
    msg: "Hello! There's nothing interesting for GET except ogres with onions/",
  });
});

app.get("/health-check", async (req, res) => {
  try {
    //For this to be successful, must connect to db
    await client.query("select now()");
    res.status(200).send("system ok");
  } catch (error) {
    //Recover from error rather than letting system halt
    console.error(error);
    res.status(500).send("An error occurred. Check server logs.");
  }
});

app.get("/pastes", async (req, res) => {
  const text = "select * from pasteBin order by id desc limit 10";
  const dbResponse = await client.query(text);
  res.status(200).json({
    status: "success",
    data: dbResponse.rows,
  });
});
connectToDBAndStartListening();

app.post("/pastes", async (req, res) => {
  const { name, pasteTitle, pasteContent } = req.body;
  if (name.length > 0 && pasteTitle.length > 0 && pasteContent.length > 0) {
    const text =
      "insert into pasteBin (name, pasteTitle, pasteContent) values ($1, $2, $3) returning *";
    const values = [name, pasteTitle, pasteContent];
    const response = await client.query(text, values);
    res.status(200).json({
      status: "success",
      data: response.rows,
    });
  } else {
    res.status(400).json({
      status: "failed",
      message: "must fill in input",
    });
  }
});

app.patch("/pastes", async(req, res) => {
  const {id, pasteContent} = req.body;
  const text = "update pasteBin set pasteContent = $2 where id = $1";
  const values = [id, pasteContent]
  const response = await client.query(text, values)
  res.status(200).json({
    status: "success",
    data: response.rows,
  });
})

async function connectToDBAndStartListening() {
  console.log("Attempting to connect to db");
  await client.connect();
  console.log("Connected to db!");

  const port = getEnvVarOrFail("PORT");
  app.listen(port, () => {
    console.log(
      `Server started listening for HTTP requests on port ${port}.  Let's go!`
    );
  });
}

//comment for push
