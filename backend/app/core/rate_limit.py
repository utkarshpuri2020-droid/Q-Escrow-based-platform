import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status

class InMemoryRateLimiter:
    def __init__(self):
        # Maps endpoint_key -> ip -> list of timestamps
        self.requests: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: defaultdict(list))

    def check_rate_limit(self, request: Request, key: str, max_requests: int, window_seconds: int = 60):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Purge entries older than window
        timestamps = self.requests[key][client_ip]
        self.requests[key][client_ip] = [t for t in timestamps if now - t < window_seconds]

        if len(self.requests[key][client_ip]) >= max_requests:
            retry_after = int(window_seconds - (now - self.requests[key][client_ip][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {max(1, retry_after)} seconds.",
                headers={"Retry-After": str(max(1, retry_after))}
            )

        self.requests[key][client_ip].append(now)

rate_limiter = InMemoryRateLimiter()
