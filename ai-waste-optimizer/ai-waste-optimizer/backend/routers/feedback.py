# routers/feedback.py - Feedback API routes
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.models import Feedback, User
from backend.schemas.schemas import FeedbackCreate, FeedbackUpdate, FeedbackResponse
from backend.auth.auth import get_current_active_user, require_manager

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

@router.get("", response_model=List[FeedbackResponse])
def get_feedbacks(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all feedbacks with optional filters."""
    query = db.query(Feedback)
    
    # Regular users can only see their own feedback
    if current_user.role == "user":
        query = query.filter(Feedback.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Feedback.status == status_filter)
    if category:
        query = query.filter(Feedback.category == category)
    if search:
        query = query.filter(
            (Feedback.title.ilike(f"%{search}%")) |
            (Feedback.content.ilike(f"%{search}%"))
        )
    
    feedbacks = query.order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()
    return feedbacks

@router.get("/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific feedback by ID."""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    # Regular users can only see their own feedback
    if current_user.role == "user" and feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this feedback"
        )
    
    return feedback

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new feedback."""
    db_feedback = Feedback(
        **feedback.dict(),
        user_id=current_user.id
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.put("/{feedback_id}", response_model=FeedbackResponse)
def update_feedback(
    feedback_id: int,
    feedback_update: FeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update a feedback status (admin/manager only)."""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    update_data = feedback_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(feedback, key, value)
    
    db.commit()
    db.refresh(feedback)
    return feedback

@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a feedback."""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    # Only the owner or admin can delete
    if current_user.role != "admin" and feedback.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this feedback"
        )
    
    db.delete(feedback)
    db.commit()
    return None
