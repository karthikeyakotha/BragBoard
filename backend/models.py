from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, CheckConstraint, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import timezone
from backend.database import Base

class UserRole(str, enum.Enum):
    employee = "employee"
    admin = "admin"

class ReactionType(str, enum.Enum):
    like = "like"
    clap = "clap"
    star = "star"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    department = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.employee, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(timezone.utc))
    profile_picture_url = Column(String, nullable=True)
    
    sent_shoutouts = relationship("ShoutOut", foreign_keys="ShoutOut.sender_id", back_populates="sender")
    received_shoutouts = relationship("ShoutOutRecipient", back_populates="recipient")
    comments = relationship("Comment", back_populates="user")
    reactions = relationship("Reaction", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class ShoutOut(Base):
    __tablename__ = "shoutouts"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(timezone.utc))
    
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_shoutouts")
    recipients = relationship("ShoutOutRecipient", back_populates="shoutout", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="shoutout", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="shoutout", cascade="all, delete-orphan")

class ShoutOutRecipient(Base):
    __tablename__ = "shoutout_recipients"
    
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    shoutout = relationship("ShoutOut", back_populates="recipients")
    recipient = relationship("User", back_populates="received_shoutouts")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(timezone.utc))
    
    shoutout = relationship("ShoutOut", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Reaction(Base):
    __tablename__ = "reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(ReactionType), nullable=False)
    
    shoutout = relationship("ShoutOut", back_populates="reactions")
    user = relationship("User", back_populates="reactions")

class ReportStatus(str, enum.Enum):
    pending = "pending"
    reviewed = "reviewed"
    resolved = "resolved"

class NotificationType(str, enum.Enum):
    tag = "tag"
    comment = "comment"
    reaction = "reaction"
    report = "report"

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"), nullable=True) # Changed to nullable
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True) # New field
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(timezone.utc))
    status = Column(Enum(ReportStatus), default=ReportStatus.pending, nullable=False)

    __table_args__ = (
        CheckConstraint(
            (shoutout_id.isnot(None)) | (comment_id.isnot(None)),
            name='ck_report_shoutout_or_comment_id'
        ),
    )

    shoutout = relationship("ShoutOut")
    comment = relationship("Comment") # New relationship
    reporter = relationship("User", foreign_keys=[reporter_id])

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    message = Column(Text, nullable=False)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(timezone.utc))

    user = relationship("User", back_populates="notifications")
    shoutout = relationship("ShoutOut")
