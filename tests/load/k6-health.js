import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

const httpReqDuration = new Trend('custom_http_req_duration', true);
const errorRate = new Rate('custom_error_rate');
const successCount = new Counter('custom_success_count');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  thresholds: { http_req_failed: ['rate<0.15'] },
  summaryTrendStats: ['avg','min','med','max','p(90)','p(95)','p(99)'],
};

export default function () {
  const res = http.get(`${BASE_URL}/health`, { timeout: '15s' });
  const ok = check(res, { 'status 200': (r) => r.status === 200 });
  httpReqDuration.add(res.timings.duration);
  errorRate.add(!ok);
  if (ok) successCount.add(1);
  sleep(0.01);
}