from fastapi import Header, HTTPException, Depends
from typing import Optional


async def get_tenant_id(x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID")):
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="Missing X-Tenant-ID header")
    return x_tenant_id
