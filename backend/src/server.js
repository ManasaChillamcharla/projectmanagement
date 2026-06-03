import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

connectDatabase()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Backend listening on ${env.BACKEND_URL}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
  });
