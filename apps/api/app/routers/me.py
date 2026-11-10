from fastapi import APIRouter, Depends

from app.auth import Principal, get_principal
from app.schemas.common import MeResponse

router = APIRouter(prefix="/api/v1", tags=["identity"])


@router.get("/me", response_model=MeResponse)
async def me(principal: Principal = Depends(get_principal)) -> MeResponse:
    return MeResponse(
        user_id=principal.user_id,
        clerk_user_id=principal.clerk_user_id,
        email=principal.email,
        display_name=principal.display_name,
        tenant_id=principal.tenant_id,
        tenant_name=principal.tenant_name,
        role=principal.role.value,
    )
