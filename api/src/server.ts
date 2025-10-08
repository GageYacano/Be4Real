import express from "express";

const app = express();
app.get("/", (_req, res) => res.send("Hello Worldd!"));

app.listen(3000, () => console.log("Server running on port 3000"));
