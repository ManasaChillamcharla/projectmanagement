import { app } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";

let databaseReady;

export default async function handler(req, res) {
  databaseReady ||= connectDatabase();
  await databaseReady;
  return app(req, res);
}
