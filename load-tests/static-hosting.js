import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:4173";

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
  stages: [
    { duration: "15s", target: 100 },
    { duration: "15s", target: 500 },
    { duration: "30s", target: 500 },
    { duration: "15s", target: 0 },
  ],
};

export default function () {
  const res = http.get(BASE_URL);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
