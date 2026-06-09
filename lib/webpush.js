import webpush from "web-push";

export const VAPID_PUBLIC_KEY = "BJH-bvrd9uoxQC76SpcJLkipflZHMbuN6ky8htrZ9Itd2-9o_2fqyEDb6WqglLStoE26XIT05CYI2KZ00eHL_XE";

const privateKey = process.env.VAPID_PRIVATE_KEY || "H9ybhvOs3qA5YUBwkoixfRuY8GaDZp9I1BB_9DQQX_0";

webpush.setVapidDetails(
  "mailto:anthony@triplefsports.com",
  VAPID_PUBLIC_KEY,
  privateKey
);

export default webpush;
