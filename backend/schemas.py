from pydantic import BaseModel, EmailStr, field_serializer, root_validator
from datetime import datetime
from typing import List, Optional
from backend.models import UserRole, ReactionType, ReportStatus
import pytz

class UserBase(BaseModel):
    email: EmailStr
    name: str
    department: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    joined_at: datetime
    profile_picture_url: Optional[str] = None
    
    @field_serializer('joined_at')
    def serialize_joined_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = pytz.UTC.localize(value)
        return value.isoformat()
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel): # New schema for login endpoint
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class Token(BaseModel): # This will remain for refresh token functionality if needed elsewhere
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class ShoutOutCreate(BaseModel):
    message: str
    recipient_ids: List[int]

class RecipientResponse(BaseModel):
    id: int
    name: str
    email: str
    department: str
    profile_picture_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class CommentResponse(BaseModel):
    id: int
    user_id: int
    content: str
    created_at: datetime
    user: UserResponse
    
    @field_serializer('created_at')
    def serialize_created_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = pytz.UTC.localize(value)
        return value.isoformat()
    
    class Config:
        from_attributes = True

class ReactionCount(BaseModel):
    type: ReactionType
    count: int

    class Config:
        from_attributes = True

class ReactionResponse(BaseModel):
    user: UserResponse
    type: ReactionType

class ShoutOutResponse(BaseModel):
    id: int
    sender_id: int
    message: str
    created_at: datetime
    sender: UserResponse
    recipients: List[RecipientResponse]
    comments: List[CommentResponse]
    reaction_counts: List[ReactionCount]
    user_reaction: Optional[ReactionType] = None
    
    @field_serializer('created_at')
    def serialize_created_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = pytz.UTC.localize(value)
        return value.isoformat()
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str

class ReactionCreate(BaseModel):
    type: ReactionType

class MostRecognizedUser(BaseModel):
    id: int
    name: str
    profile_picture_url: Optional[str] = None
    count: int

class AdminStatsResponse(BaseModel):
    total_shoutouts: int
    total_users: int
    most_recognized_users: List[MostRecognizedUser] = []

class TopContributor(BaseModel):
    id: int
    name: str
    department: str
    profile_picture_url: Optional[str] = None
    total_shoutouts_sent: int

class ReportCreate(BaseModel):
    shoutout_id: Optional[int] = None
    comment_id: Optional[int] = None
    reason: Optional[str] = None

    @root_validator(skip_on_failure=True)
    def check_shoutout_or_comment_id(cls, values):
        shoutout_id, comment_id = values.get('shoutout_id'), values.get('comment_id')
        if shoutout_id is None and comment_id is None:
            raise ValueError("Either shoutout_id or comment_id must be provided.")
        return values

class ReporterInfo(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    id: int
    shoutout_id: Optional[int] = None
    comment_id: Optional[int] = None
    reporter: Optional[ReporterInfo] = None # New, Optional because report.reporter might be null if reporter user is deleted
    reason: Optional[str] = None
    created_at: datetime
    status: ReportStatus
    target_type: Optional[str] = None # New
    target_user_name: Optional[str] = None # New

    @field_serializer('created_at')
    def serialize_created_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = pytz.UTC.localize(value)
        return value.isoformat()
    
    class Config:
        from_attributes = True

class DepartmentShoutOutStats(BaseModel):
    department: str
    shoutout_count: int
    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    type: str
    message: str
    shoutout_id: Optional[int]
    is_read: bool
    created_at: datetime

    @field_serializer('created_at')
    def serialize_created_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = pytz.UTC.localize(value)
        return value.isoformat()

    class Config:
        from_attributes = True
