# Asynchronous Queue Pipeline (BullMQ)

## 1. Queue Architecture

```mermaid
sequenceDiagram
    participant API as Express API
    participant Bull as BullMQ (Redis)
    participant Worker as Email Worker
    participant Provider as Email Provider

    API->>Bull: emailQueue.add(jobName, payload, options)
    Note over API: HTTP request finishes in <25ms
    Bull->>Worker: Job Picked Up
    Worker->>Provider: provider.sendEmail(params)
    alt Success
        Worker-->>Bull: job.completed()
    else Network / Provider Failure
        Worker-->>Bull: job.failed()
        Note over Bull: Retries with exponential backoff (1s, 2s, 4s...)
    end
```

## 2. Failure Handling & Resilience
- **Exponential Backoff**: Jobs are retried up to 3 times with exponential backoff starting at 1000ms.
- **Concurrency Controls**: Workers process up to 10 concurrent email deliveries with rate limiting (max 50 jobs/sec) to avoid provider rate limit throttling.
- **Dead-Letter Retention**: Failed jobs are kept for 24 hours for debugging and manual replay.
