import webpush from "web-push";

import { VAPID_PUBLIC_KEY } from "./push";
export { VAPID_PUBLIC_KEY };

const privateKey = process.env.VAPID_PRIVATE_KEY || "H9ybhvOs3qA5YUBwkoixfRuY8GaDZp9I1BB_9DQQX_0";

webpush.setVapidDetails(
  "mailto:anthony@triplefsports.com",
  VAPID_PUBLIC_KEY,
  privateKey
);

export default webpush;
