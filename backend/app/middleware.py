import json
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
import os

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Default tenant ID for no-login mode
        DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001"
        
        auth_header = request.headers.get("Authorization")
        tenant_id = DEFAULT_TENANT_ID

        if auth_header:
            try:
                parts = auth_header.split(" ")
                if len(parts) == 2:
                    token = parts[1]
                    # In production use JWKS; here we use secret for simplicity
                    payload = jwt.decode(
                        token,
                        os.getenv("JWT_SECRET", "dev-secret"),
                        algorithms=["HS256"],
                        options={"verify_aud": False},
                    )
                    tenant_id = payload.get("tenant_id", DEFAULT_TENANT_ID)
            except (JWTError, IndexError):
                # Fallback to default tenant if token is invalid
                pass
        
        request.state.tenant_id = tenant_id
        request.state.rls_tenant = tenant_id
        
        response = await call_next(request)
        return response
