import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  server: {
    OPENWEATHERMAP_API_KEY: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: {},
});
