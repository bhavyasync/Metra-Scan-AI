from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime
)

from datetime import datetime

from app.database.database import Base


class Scan(Base):

    __tablename__ = "scans"

    id = Column(
        Integer,
        primary_key=True
    )

    image_url = Column(
        String
    )

    compliance_score = Column(
        Float
    )

    inspection_confidence = Column(
        Float
    )

    status = Column(
        String
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )