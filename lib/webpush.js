import webpush from "web-push";

export const VAPID_PUBLIC_KEY = "BObWJUwxM9tPxbrXUhj4JW15F1ngheVLKhqlSiQklDc0LtlPMITMNB1D-jx8ywwEnZfPsYKGCI5EmgCMqfRt2IU";

webpush.setVapidDetails(
  "mailto:anthony@triplefsports.com",
  VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY || "JB16-oY60WmqjjePPZqdEGkyewyDotvpQ_rM4Xqp1c8"
);

export default webpush;
