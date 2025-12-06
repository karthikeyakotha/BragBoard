# backend/seed_data.py
import bcrypt
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import User, ShoutOut, Comment, Reaction, ShoutOutRecipient

def seed_everything(db: Session):
    print("🌱 Seeding 10+ Users and Content...")

    # 1. Setup Password
    raw_pw = "password123"
    hashed_pw = bcrypt.hashpw(raw_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # 2. Define The Squad (13 Users total)
    users_data = [
        # Original 3
        {"name": "Alice Engineer", "email": "alice@bragboard.com", "dept": "Engineering", "role": "user"},
        {"name": "Bob Sales",      "email": "bob@bragboard.com",   "dept": "Sales",       "role": "user"},
        {"name": "Charlie HR",     "email": "charlie@bragboard.com","dept": "Human Resources", "role": "admin"},
        # New 10
        {"name": "David Product",  "email": "david@bragboard.com", "dept": "Product",     "role": "user"},
        {"name": "Eve Designer",   "email": "eve@bragboard.com",   "dept": "Design",      "role": "user"},
        {"name": "Frank Finance",  "email": "frank@bragboard.com", "dept": "Finance",     "role": "user"},
        {"name": "Grace Marketing","email": "grace@bragboard.com", "dept": "Marketing",   "role": "user"},
        {"name": "Heidi Support",  "email": "heidi@bragboard.com", "dept": "Customer Support", "role": "user"},
        {"name": "Ivan Intern",    "email": "ivan@bragboard.com",  "dept": "Engineering", "role": "user"},
        {"name": "Judy Legal",     "email": "judy@bragboard.com",  "dept": "Legal",       "role": "user"},
        {"name": "Kevin DevOps",   "email": "kevin@bragboard.com", "dept": "Engineering", "role": "user"},
        {"name": "Liam Sales",     "email": "liam@bragboard.com",  "dept": "Sales",       "role": "user"},
        {"name": "Mia CEO",        "email": "mia@bragboard.com",   "dept": "Executive",   "role": "admin"},
    ]

    created_users = []

    # 3. Insert Users (Idempotent: Checks if email exists first)
    for u_data in users_data:
        existing = db.query(User).filter(User.email == u_data["email"]).first()
        if not existing:
            new_user = User(
                name=u_data["name"],
                email=u_data["email"],
                password=hashed_pw,
                department=u_data["dept"],
                role=u_data["role"],
                joined_at=datetime.now() - timedelta(days=random.randint(1, 30)) # Joined randomly in last 30 days
            )
            db.add(new_user)
            created_users.append(new_user)
        else:
            created_users.append(existing)
    
    db.commit()
    # Refresh all to ensure we have IDs
    for u in created_users: db.refresh(u)

    # 4. Generate Random Shoutouts
    # (Only generate if we actually have users)
    if not created_users: return {"message": "No new data added."}

    messages = [
        "helped me debug a nasty issue properly.",
        "closed the deal of the quarter! Amazing work.",
        "organized the best team building event ever.",
        "stayed late to ensure the deployment went smooth.",
        "designed the beautiful new landing page.",
        "always brings positive energy to the morning standup.",
        "wrote excellent documentation for the new API.",
        "handled a difficult customer with so much patience.",
        "optimized the database queries, site is 2x faster!",
        "mentored the new interns effectively."
    ]

    shoutout_objects = []

    # Create 15 Random Shoutouts
    for _ in range(15):
        sender = random.choice(created_users)
        recipient = random.choice([u for u in created_users if u.id != sender.id]) # Cannot shoutout self
        
        msg = f"Big thanks to {recipient.name.split(' ')[0]}! They {random.choice(messages)} 🔥"
        
        # Create Shoutout
        so = ShoutOut(
            sender_id=sender.id,
            message=msg,
            created_at=datetime.now() - timedelta(hours=random.randint(1, 48))
        )
        db.add(so)
        db.commit() # Commit to get ID
        db.refresh(so)
        shoutout_objects.append(so)

        # Link Recipient
        link = ShoutOutRecipient(shoutout_id=so.id, recipient_id=recipient.id)
        db.add(link)

    db.commit()

    # 5. Add Random Comments & Reactions
    for so in shoutout_objects:
        # Add 0 to 3 comments per shoutout
        for _ in range(random.randint(0, 3)):
            commenter = random.choice(created_users)
            db.add(Comment(
                content=random.choice(["Totally agree!", "Well done!", "Deserved!", "Awesome work!", "👏👏👏"]),
                user_id=commenter.id,
                shoutout_id=so.id,
                created_at=datetime.now()
            ))
        
        # Add 0 to 5 reactions per shoutout
        for _ in range(random.randint(0, 5)):
            reactor = random.choice(created_users)
            # Check if reaction exists to prevent duplicate key error (simple check)
            exists = db.query(Reaction).filter(Reaction.shoutout_id==so.id, Reaction.user_id==reactor.id).first()
            if not exists:
                db.add(Reaction(
                    shoutout_id=so.id, 
                    user_id=reactor.id, 
                    type=random.choice(["like", "clap", "star"])
                ))

    db.commit()

    return {"message": f"✅ Database populated with {len(users_data)} users and random activity!"}
