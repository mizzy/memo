import { Hono } from "hono";
import { cors } from "hono/cors";
import vaults from "./routes/vaults.js";
import memos from "./routes/memos.js";
import folders from "./routes/folders.js";
import images from "./routes/images.js";

export type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

app.route("/api/vaults", vaults);
app.route("/api/folders", folders);
app.route("/api/memos", memos);
app.route("/api/images", images);

export default app;
