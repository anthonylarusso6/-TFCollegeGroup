import webpush from "web-push";

export const VAPID_PUBLIC_KEY = "BObWJUwxM9tPxbrXUhj4JW15F1ngheVLKhqlSiQklDc0LtlPMITMNB1D-jx8ywwEnZfPsYKGCI5EmgCMqfRt2IU";

webpush.setVapidDetails(
  "mailto:anthony@triplefsports.com",
  VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY || ""
);

export default webpush;
