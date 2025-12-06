from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime
import os
import pytz
from PIL import Image
import io

from backend import models, schemas
from backend.database import engine, get_db, Base
from backend.auth import (
    get_password_hash, verify_password, create_access_token, create_refresh_token,
    get_current_user, get_current_admin
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BragBoard API", version="1.0.0")

app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

origins = [
    "http://localhost:5173",          # Vite dev (local)
    "https://brag-board.vercel.app", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,          
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "BragBoard API is running", "docs": "/docs"}

@app.post("/api/auth/register", response_model=schemas.LoginResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # hash the password BEFORE saving
    hashed_password = get_password_hash(user_data.password)

    user = models.User(
        full_name=user_data.full_name,
        email=user_data.email,
        password=hashed_password,   # store hashed password
        department=user_data.department,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": schemas.UserResponse.from_orm(user),
    }

@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token({"sub": user.email})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": schemas.UserResponse.from_orm(user)
    }

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserResponse.from_orm(current_user)

@app.patch("/api/users/me", response_model=schemas.UserResponse)
def update_me(user_data: schemas.UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_data.name is not None:
        current_user.name = user_data.name
    
    if hasattr(user_data, 'new_password') and user_data.new_password and hasattr(user_data, 'current_password') and user_data.current_password:
        if not verify_password(user_data.current_password, current_user.password):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        current_user.password = get_password_hash(user_data.new_password)

    if user_data.email is not None and user_data.email != current_user.email:
        existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_data.email

    db.commit()
    db.refresh(current_user)
    
    return current_user

@app.delete("/api/users/me/picture", response_model=schemas.UserResponse)
def delete_profile_picture(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.profile_picture_url:
        file_path = f"backend{current_user.profile_picture_url}"
        if os.path.exists(file_path):
            os.remove(file_path)
        current_user.profile_picture_url = None
        db.commit()
        db.refresh(current_user)
    return current_user

@app.post("/api/users/me/picture", response_model=schemas.UserResponse)
def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not os.path.exists("backend/uploads"):
        os.makedirs("backend/uploads")

    image_data = file.file.read()
    img = Image.open(io.BytesIO(image_data))
    img = img.resize((128, 128), Image.Resampling.LANCZOS)

    file_name = f"{current_user.id}_profile.jpeg"
    file_path = f"backend/uploads/{file_name}"
    img.save(file_path, "JPEG", quality=85)

    current_user.profile_picture_url = f"/uploads/{file_name}"
    db.commit()
    db.refresh(current_user)
    
    return current_user

@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.User)
    if department:
        query = query.filter(models.User.department == department)
    return query.all()

@app.get("/api/users/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_reaction_counts(db: Session, shoutout_id: int) -> List[schemas.ReactionCount]:
    counts = db.query(
        models.Reaction.type,
        func.count(models.Reaction.id).label('count')
    ).filter(models.Reaction.shoutout_id == shoutout_id).group_by(models.Reaction.type).all()
    
    return [schemas.ReactionCount(type=r.type, count=r.count) for r in counts]

def get_user_reaction(db: Session, shoutout_id: int, user_id: int) -> Optional[models.ReactionType]:
    reaction = db.query(models.Reaction).filter(
        models.Reaction.shoutout_id == shoutout_id,
        models.Reaction.user_id == user_id
    ).first()
    return reaction.type if reaction else None

def _get_shoutout_related_user_ids(shoutout: models.ShoutOut, exclude_user_id: int) -> set[int]:
    """
    Get a set of user IDs related to a shoutout (sender and recipients),
    excluding a specific user.
    """
    user_ids = {shoutout.sender_id}
    for recipient in shoutout.recipients:
        user_ids.add(recipient.recipient_id)
    
    user_ids.discard(exclude_user_id)
    return user_ids

def format_shoutout(shoutout: models.ShoutOut, db: Session, current_user_id: int) -> schemas.ShoutOutResponse:
    sender_data = schemas.UserResponse.from_orm(shoutout.sender)
    recipients_data = [
        schemas.RecipientResponse(
            id=r.recipient.id,
            name=r.recipient.name,
            email=r.recipient.email,
            department=r.recipient.department,
            profile_picture_url=r.recipient.profile_picture_url
        ) for r in shoutout.recipients
    ]

    reaction_counts = get_reaction_counts(db, shoutout.id)
    user_reaction = get_user_reaction(db, shoutout.id, current_user_id)

    return schemas.ShoutOutResponse(
        id=shoutout.id,
        sender_id=shoutout.sender_id,
        message=shoutout.message,
        created_at=shoutout.created_at,
        sender=sender_data,
        recipients=recipients_data,
        comments=shoutout.comments,
        reaction_counts=reaction_counts,
        user_reaction=user_reaction
    )

@app.post("/api/shoutouts", response_model=schemas.ShoutOutResponse, status_code=status.HTTP_201_CREATED)
def create_shoutout(
    shoutout_data: schemas.ShoutOutCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not shoutout_data.recipient_ids:
        raise HTTPException(status_code=400, detail="At least one recipient is required")

    new_shoutout = models.ShoutOut(
        sender_id=current_user.id,
        message=shoutout_data.message
    )
    db.add(new_shoutout)
    db.flush()

    for recipient_id in shoutout_data.recipient_ids:
        recipient = db.query(models.User).filter(models.User.id == recipient_id).first()
        if recipient:
            shoutout_recipient = models.ShoutOutRecipient(
                shoutout_id=new_shoutout.id,
                recipient_id=recipient.id
            )
            db.add(shoutout_recipient)
            
            if recipient.id != current_user.id:
                notification = models.Notification(
                    user_id=recipient.id,
                    type=models.NotificationType.tag,
                    message=f"{current_user.name} recognised you in a shout-out",
                    shoutout_id=new_shoutout.id
                )
                db.add(notification)
    
    db.commit()
    db.refresh(new_shoutout)
    
    return format_shoutout(new_shoutout, db, current_user.id)

@app.get("/api/shoutouts", response_model=List[schemas.ShoutOutResponse])
def get_shoutouts(
    department: Optional[str] = None,
    sender_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.ShoutOut)
    
    if department:
        query = query.join(models.User, models.ShoutOut.sender_id == models.User.id).filter(models.User.department == department)
    
    if sender_id:
        query = query.filter(models.ShoutOut.sender_id == sender_id)

    if start_date:
        if start_date.tzinfo is None:
            start_date = pytz.UTC.localize(start_date)
        query = query.filter(models.ShoutOut.created_at >= start_date)
    
    shoutouts = query.order_by(desc(models.ShoutOut.created_at)).all()
    
    return [format_shoutout(s, db, current_user.id) for s in shoutouts]

@app.get("/api/users/me/shoutouts", response_model=List[schemas.ShoutOutResponse])
def get_my_shoutouts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shoutouts = db.query(models.ShoutOut).filter(models.ShoutOut.sender_id == current_user.id).order_by(desc(models.ShoutOut.created_at)).all()
    return [format_shoutout(s, db, current_user.id) for s in shoutouts]

@app.get("/api/users/me/tagged", response_model=List[schemas.ShoutOutResponse])
def get_tagged_shoutouts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shoutout_ids = db.query(models.ShoutOutRecipient.shoutout_id).filter(models.ShoutOutRecipient.recipient_id == current_user.id).all()
    shoutout_ids = [s.shoutout_id for s in shoutout_ids]
    
    shoutouts = db.query(models.ShoutOut).filter(models.ShoutOut.id.in_(shoutout_ids)).order_by(desc(models.ShoutOut.created_at)).all()
    
    return [format_shoutout(s, db, current_user.id) for s in shoutouts]

@app.get("/api/shoutouts/{shoutout_id}", response_model=schemas.ShoutOutResponse)
def get_shoutout(
    shoutout_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shout-out not found")
    
    return format_shoutout(shoutout, db, current_user.id)

@app.post("/api/shoutouts/{shoutout_id}/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    shoutout_id: int,
    comment_data: schemas.CommentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shout-out not found")
    
    new_comment = models.Comment(
        shoutout_id=shoutout_id,
        user_id=current_user.id,
        content=comment_data.content
    )
    db.add(new_comment)

    target_user_ids = _get_shoutout_related_user_ids(shoutout, exclude_user_id=current_user.id)
    for user_id in target_user_ids:
        if user_id == shoutout.sender_id:
            message = f"{current_user.name} commented on your shout-out"
        else:
            message = f"{current_user.name} commented on a shout-out you are part of"

        notification = models.Notification(
            user_id=user_id,
            type=models.NotificationType.comment,
            message=message,
            shoutout_id=shoutout.id
        )
        db.add(notification)

    db.commit()
    db.refresh(new_comment)
    
    return new_comment

@app.post("/api/shoutouts/{shoutout_id}/reactions")
def toggle_reaction(
    shoutout_id: int,
    reaction_data: schemas.ReactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shout-out not found")
    
    existing_reaction = db.query(models.Reaction).filter(
        models.Reaction.shoutout_id == shoutout_id,
        models.Reaction.user_id == current_user.id
    ).first()
    
    action = None
    if existing_reaction:
        if existing_reaction.type == reaction_data.type:
            db.delete(existing_reaction)
            action = "removed"
        else:
            existing_reaction.type = reaction_data.type
            action = "updated"
    else:
        new_reaction = models.Reaction(
            shoutout_id=shoutout_id,
            user_id=current_user.id,
            type=reaction_data.type
        )
        db.add(new_reaction)
        action = "added"

    if action == "added":
        target_user_ids = _get_shoutout_related_user_ids(shoutout, exclude_user_id=current_user.id)
        for user_id in target_user_ids:
            if user_id == shoutout.sender_id:
                message = f"{current_user.name} reacted to your shout-out"
            else:
                message = f"{current_user.name} reacted to a shout-out you are part of"

            notification = models.Notification(
                user_id=user_id,
                type=models.NotificationType.reaction,
                message=message,
                shoutout_id=shoutout.id
            )
            db.add(notification)

    db.commit()
    
    return {"message": f"Reaction {action}", "action": action}

@app.get("/api/shoutouts/{shoutout_id}/reactions", response_model=List[schemas.ReactionResponse])
def get_shoutout_reactions(
    shoutout_id: int,
    type: Optional[models.ReactionType] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(models.Reaction).filter(models.Reaction.shoutout_id == shoutout_id)
    
    if type:
        query = query.filter(models.Reaction.type == type)
        
    reactions = query.offset((page - 1) * limit).limit(limit).all()
    
    return reactions

@app.post("/api/reports", status_code=status.HTTP_201_CREATED)
def create_report(
    report: schemas.ReportCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        new_report = models.Report(
            shoutout_id=report.shoutout_id,
            comment_id=report.comment_id,
            reason=report.reason,
            reporter_id=current_user.id,
            status=models.ReportStatus.pending
        )
        db.add(new_report)
        db.flush()

        admins = db.query(models.User).filter(models.User.role == models.UserRole.admin).all()
        for admin in admins:
            if report.comment_id is not None:
                message = f"{current_user.name} reported a comment on shout-out #{report.shoutout_id}"
            else:
                message = f"{current_user.name} reported shout-out #{report.shoutout_id}"
            
            notification = models.Notification(
                user_id=admin.id,
                type=models.NotificationType.report,
                message=message,
                shoutout_id=report.shoutout_id,
                is_read=False
            )
            db.add(notification)
        
        db.commit()
        db.refresh(new_report)

        return {
            "message": "Your report has been submitted and sent to the admin.",
            "report": {
                "id": new_report.id,
                "shoutout_id": new_report.shoutout_id,
                "comment_id": new_report.comment_id,
                "reason": new_report.reason,
                "status": new_report.status,
                "created_at": new_report.created_at,
            }
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating report: {e}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error while creating report."})

@app.get("/api/admin/reports", response_model=List[schemas.ReportResponse])
def get_reports(
    status: Optional[models.ReportStatus] = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """
    Return the list of reports for admin dashboard.
    If `status` is provided, filter by that status (e.g. pending, reviewed, resolved).
    Order by created_at DESC.
    """
    try:
        query = db.query(models.Report).outerjoin(models.User, models.Report.reporter_id == models.User.id)

        if status:
            query = query.filter(models.Report.status == status)
        
        reports = query.order_by(models.Report.created_at.desc()).all()

        response_reports = []
        for report in reports:
            reporter_info = schemas.ReporterInfo(
                id=report.reporter.id,
                name=report.reporter.name
            ) if report.reporter else None

            target_type = None
            target_user_name = None
            if report.shoutout_id:
                target_type = "shoutout"
                shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == report.shoutout_id).first()
                if shoutout and shoutout.sender:
                    target_user_name = shoutout.sender.name
            elif report.comment_id:
                target_type = "comment"
                comment = db.query(models.Comment).filter(models.Comment.id == report.comment_id).first()
                if comment and comment.user:
                    target_user_name = comment.user.name
            
            response_reports.append(
                schemas.ReportResponse(
                    id=report.id,
                    shoutout_id=report.shoutout_id,
                    comment_id=report.comment_id,
                    reporter=reporter_info,
                    reason=report.reason,
                    created_at=report.created_at,
                    status=report.status,
                    target_type=target_type,
                    target_user_name=target_user_name
                )
            )
        return response_reports
    except Exception as e:
        print(f"Error getting reports: {e}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error while getting reports."})


@app.patch("/api/admin/reports/{report_id}/status", response_model=schemas.ReportResponse)
def update_report_status(
    report_id: int,
    status: models.ReportStatus = Body(..., embed=True),
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    report.status = status
    db.commit()
    db.refresh(report)
    return report

@app.delete("/api/shoutouts/{shoutout_id}", status_code=status.HTTP_200_OK)
def delete_shoutout(
    shoutout_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shout-out not found")

    if shoutout.sender_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this shout-out")

    # Manually delete related notifications, as they don't have a direct relationship with cascade
    db.query(models.Notification).filter(models.Notification.shoutout_id == shoutout_id).delete(synchronize_session=False)

    # Manually delete related reports to prevent foreign key constraint errors
    db.query(models.Report).filter(models.Report.shoutout_id == shoutout_id).delete(synchronize_session=False)

    db.delete(shoutout)
    db.commit()
    return {"message": "Shout-out deleted successfully"}

@app.delete("/api/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user_to_delete)
    db.commit()
    return {"message": "User deleted successfully"}

@app.delete("/api/comments/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment(
    comment_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    if comment.user_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}

@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.is_read.asc(), models.Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return notifications

@app.post("/api/notifications/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return notification

@app.post("/api/notifications/mark-all-read", status_code=status.HTTP_200_OK)
def mark_all_notifications_as_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {"status": "ok"}

@app.get("/api/admin/stats", response_model=schemas.AdminStatsResponse)
def get_admin_stats(
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(models.User).count()
    total_shoutouts = db.query(models.ShoutOut).count()

    most_recognized_users_data = (
        db.query(
            models.User.id,
            models.User.name,
            models.User.profile_picture_url,
            func.count(models.ShoutOutRecipient.id).label("count"),
        )
        .join(models.ShoutOutRecipient, models.User.id == models.ShoutOutRecipient.recipient_id)
        .group_by(models.User.id)
        .order_by(desc("count"))
        .limit(5)
        .all()
    )
    
    most_recognized_users = [
        schemas.MostRecognizedUser(
            id=user.id,
            name=user.name,
            profile_picture_url=user.profile_picture_url,
            count=user.count
        )
        for user in most_recognized_users_data
    ]

    return {
        "total_users": total_users,
        "total_shoutouts": total_shoutouts,
        "most_recognized_users": most_recognized_users,
    }

@app.get("/api/admin/stats/top-contributors", response_model=List[schemas.TopContributor])
def get_top_contributors(
    limit: int = 5,
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    top_contributors_data = (
        db.query(
            models.User,
            func.count(models.ShoutOut.id).label("total_shoutouts_sent"),
        )
        .join(models.ShoutOut, models.User.id == models.ShoutOut.sender_id)
        .group_by(models.User.id)
        .order_by(desc("total_shoutouts_sent"))
        .limit(limit)
        .all()
    )

    return [
        schemas.TopContributor(
            id=user.id,
            name=user.name,
            department=user.department,
            profile_picture_url=user.profile_picture_url,
            total_shoutouts_sent=count,
        )
        for user, count in top_contributors_data
    ]

@app.get("/api/admin/stats/shoutouts-by-department",
         response_model=List[schemas.DepartmentShoutOutStats])
def get_shoutouts_by_department(current_user: models.User = Depends(get_current_admin),
                                db: Session = Depends(get_db)):
    results = (
        db.query(models.User.department,
                 func.count(models.ShoutOut.id).label("shoutout_count"))
        .join(models.ShoutOut, models.ShoutOut.sender_id == models.User.id)
        .group_by(models.User.department)
        .all()
    )
    return [
        schemas.DepartmentShoutOutStats(
            department=d or "Unknown",
            shoutout_count=c
        ) for d, c in results
    ]

    
