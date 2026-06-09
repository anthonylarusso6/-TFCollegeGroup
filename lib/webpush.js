import webpush from "web-push";

export const VAPID_PUBLIC_KEY = "BJH-bvrd9uoxQC76SpcJLkipflZHMbuN6ky8htrZ9Itd2-9o_2fqyEDb6WqglLStoE26XIT05CYI2KZ00eHL_XE";

webpush.setVapidDetails(
  "mailto:anthony@triplefsports.com",
  VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default webpush;
