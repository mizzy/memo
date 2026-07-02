import { Hono } from "hono";
import { cors } from "hono/cors";
import vaults from "./routes/vaults.js";
import memos from "./routes/memos.js";

export type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

app.route("/api/vaults", vaults);
app.route("/api/memos", memos);

export default app;
