from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import Principal, get_principal
from app.database import get_db
from app.models.entities import Claim, EvidenceItem, EvidenceSource, Workflow
from app.schemas.common import ClaimOut, EvidenceOut

router = APIRouter(prefix="/api/v1", tags=["evidence"])


@router.get("/workflows/{workflow_id}/evidence", response_model=list[EvidenceOut])
async def workflow_evidence(
    workflow_id: str,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> list[EvidenceOut]:
    wf = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id, Workflow.tenant_id == principal.tenant_id
        )
    )
    if wf.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    sources = (
        await db.execute(
            select(EvidenceSource).where(
                EvidenceSource.workflow_id == workflow_id,
                EvidenceSource.tenant_id == principal.tenant_id,
            )
        )
    ).scalars().all()

    out: list[EvidenceOut] = []
    for src in sources:
        items = (
            await db.execute(
                select(EvidenceItem).where(
                    EvidenceItem.source_id == src.id, EvidenceItem.tenant_id == principal.tenant_id
                )
            )
        ).scalars().all()
        out.append(
            EvidenceOut(
                source_id=src.id,
                title=src.title,
                canonical_uri=src.canonical_uri,
                source_type=src.source_type,
                content_hash=src.content_hash,
                collected_at=src.collected_at,
                excerpts=[i.excerpt for i in items],
            )
        )
    return out


@router.get("/workflows/{workflow_id}/claims", response_model=list[ClaimOut])
async def workflow_claims(
    workflow_id: str,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> list[ClaimOut]:
    claims = (
        await db.execute(
            select(Claim).where(
                Claim.workflow_id == workflow_id, Claim.tenant_id == principal.tenant_id
            )
        )
    ).scalars().all()
    return [
        ClaimOut(
            id=c.id,
            claim_text=c.claim_text,
            claim_type=c.claim_type,
            status=c.status.value,
            confidence=c.confidence,
            uncertainty_notes=c.uncertainty_notes,
        )
        for c in claims
    ]


@router.get("/workflows/{workflow_id}/report")
async def workflow_report(
    workflow_id: str,
    principal: Principal = Depends(get_principal),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id, Workflow.tenant_id == principal.tenant_id
        )
    )
    wf = result.scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"workflow_id": wf.id, "status": wf.status.value, "report": wf.report}
