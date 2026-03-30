from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import enum

Base = declarative_base()

class LeadStatus(enum.Enum):
    FOUND = "Found"
    REQUESTED = "Requested"
    CONNECTED = "Connected"
    REJECTED = "Rejected"
    MESSAGED = "Messaged"
    RESPONDED = "Responded"

class Lead(Base):
    """
    The Lead model represents a professional you've discovered on LinkedIn.
    This is your 'Local CRM'.
    """
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True)
    full_name = Column(String, nullable=False)
    profile_url = Column(String, unique=True, nullable=False)
    headline = Column(String)
    about_text = Column(Text)
    status = Column(Enum(LeadStatus), default=LeadStatus.FOUND)
    ai_message = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def __repr__(self):
        return f"<Lead(name='{self.full_name}', status='{self.status.value}')>"

# Database helper functions
def get_engine(db_url="sqlite:///./networking.db"):
    return create_engine(db_url)

def init_db(engine):
    Base.metadata.create_all(engine)
    print("Database initialized successfully.")

if __name__ == "__main__":
    # Create the database and tables
    engine = get_engine()
    init_db(engine)
