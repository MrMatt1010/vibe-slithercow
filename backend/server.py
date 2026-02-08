from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Fall back to an in-memory store if MongoDB is not reachable (useful for local dev)
use_mongo = True
status_store = []
try:
    # quick synchronous ping using pymongo to detect availability
    from pymongo import MongoClient as PyMongoClient

    sync_client = PyMongoClient(mongo_url, serverSelectionTimeoutMS=2000)
    sync_client.admin.command('ping')
    sync_client.close()
except Exception:
    use_mongo = False

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)

    # If Mongo is available, persist there; otherwise use in-memory store for dev
    if use_mongo:
        try:
            # Convert to dict and serialize datetime to ISO string for MongoDB
            doc = status_obj.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()

            _ = await db.status_checks.insert_one(doc)
            return status_obj
        except Exception:
            logger.exception("Failed to create status check")
            raise HTTPException(status_code=500, detail="Failed to create status check")
    else:
        doc = status_obj.model_dump()
        # keep timestamp as a datetime in-memory
        status_store.append(doc)
        return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if use_mongo:
        # Exclude MongoDB's _id field from the query results
        status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)

        # Convert ISO string timestamps back to datetime objects
        for check in status_checks:
            ts = check.get('timestamp')
            if isinstance(ts, str):
                try:
                    check['timestamp'] = datetime.fromisoformat(ts)
                except Exception:
                    # leave as-is if it can't be parsed
                    pass

        return status_checks
    else:
        # Return a copy of the in-memory store
        return list(status_store)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()