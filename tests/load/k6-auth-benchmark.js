import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    // Stage 1: Warmup & baseline (100 VUs)
    baseline: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "30s", target: 100 },
        { duration: "1m", target: 100 },
        { duration: "10s", target: 0 }
      ],
      gracefulRampDown: "10s"
    },
    // Stage 2: Stress test (1,000 VUs)
    stress: {
      executor: "ramping-vus",
      startTime: "2m",
      startVUs: 100,
      stages: [
        { duration: "30s", target: 1000 },
        { duration: "1m", target: 1000 },
        { duration: "15s", target: 0 }
      ],
      gracefulRampDown: "15s"
    }
  },
  thresholds: {
    http_req_duration: ["p(95)<200", "p(99)<500"], // 95% of requests must complete below 200ms
    http_req_failed: ["rate<0.01"]                 // Error rate below 1%
  }
};

const BASE_URL = __ENV.API_URL || "http://localhost:4000";

export default function () {
  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
  const user = {
    name: `Load User ${uniqueId}`,
    email: `loaduser_${uniqueId}@example.com`,
    password: "StrongLoadPassword123!"
  };

  // 1. Register User (Async Queue Delivery)
  const regRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(user),
    { headers: { "Content-Type": "application/json" } }
  );

  check(regRes, {
    "registration status is 201 or 429": (r) => r.status === 201 || r.status === 429
  });

  sleep(0.5);

  // 2. Health & Metrics Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    "health status is 200": (r) => r.status === 200
  });

  sleep(1);
}
