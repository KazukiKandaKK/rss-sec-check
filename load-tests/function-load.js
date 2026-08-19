import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:5001";
const PROJECT = __ENV.PROJECT || "rss-sec-check";
const REGION = __ENV.REGION || "us-central1";
const FUNCTION = __ENV.FUNCTION || "fetchRssOnSchedule-0";

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<5000"],
  },
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "1m", target: 50 },
    { duration: "2m", target: 50 },
    { duration: "30s", target: 0 },
  ],
};

export default function () {
  const url = `${BASE_URL}/${PROJECT}/${REGION}/${FUNCTION}`;
  const res = http.post(url, "{}", {
    headers: { "Content-Type": "application/json" },
    timeout: "60s",
  });
  check(res, {
    "status is 2xx": (r) => r.status >= 200 && r.status < 300,
  });
}
