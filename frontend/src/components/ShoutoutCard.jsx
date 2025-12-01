import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaHandsClapping, FaStar, FaEllipsisVertical } from 'react-icons/fa6';
import { formatTimestamp } from '../utils/date';
import { shoutoutsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MentionsInput, Mention } from 'react-mentions';
import ReactionViewer from './ReactionViewer';
import ReportModal from './ReportModal';
import toast from 'react-hot-toast';

const mentionStyle = {
  control: {
    backgroundColor: '#fff',
    fontSize: 14,
    fontWeight: 'normal',
  },
  highlighter: {
    padding: 9,
    border: '1px solid transparent',
  },
  input: {
    padding: 9,
    border: '1px solid #ced4da',
    borderRadius: 4,
  },
  suggestions: {
    list: {
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.15)',
      fontSize: 14,
      zIndex: 9999,
    },
    item: {
      padding: '5px 15px',
      borderBottom: '1px solid rgba(0,0,0,0.15)',
      '&focused': {
        backgroundColor: '#f7f7f7',
      },
    },
  },
};

const parseMentions = (text) => {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = text.split(mentionRegex);

  return parts.map((part, i) => {
    if (i % 3 === 1) {
      const name = part;
      const id = parts[i + 1];
      return (
        <Link to={`/users/${id}`} key={i} className="text-purple-600 dark:text-purple-400 font-semibold">
          @{name}
        </Link>
      );
    }
    if (i % 3 === 2) {
      return null;
    }
    return part;
  });
};

const DropdownMenu = ({ isOwnerOrAdmin, onDelete, onReportClick, itemId, currentUserRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onDelete) onDelete(itemId);
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onReportClick) onReportClick();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={(e) => {e.stopPropagation(); setIsOpen(!isOpen);}} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-100">
        <FaEllipsisVertical />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10">
          {currentUserRole !== 'admin' && !isOwnerOrAdmin && (
            <button
              onClick={handleReportClick}
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
            >
              Report
            </button>
          )}
          {isOwnerOrAdmin && (
            <button
              onClick={handleDeleteClick}
              className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};


export default function ShoutoutCard({ shoutout, onUpdate, onDelete, onReport }) {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [users, setUsers] = useState([]);
  const [showReactionViewer, setShowReactionViewer] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState({ shoutoutId: null, commentId: null });
  const [isDeleteCommentModalOpen, setIsDeleteCommentModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersAPI.getUsers();
        const formattedUsers = response.data.map((user) => ({
          id: user.id,
          display: user.name,
        }));
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  const reactionIcons = {
    like: FaHeart,
    clap: FaHandsClapping,
    star: FaStar,
  };

  const handleReaction = async (e, type) => {
    e.stopPropagation();
    try {
      await shoutoutsAPI.toggleReaction(shoutout.id, type);
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await shoutoutsAPI.addComment(shoutout.id, comment);
      setComment('');
      onUpdate();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const openDeleteCommentModal = (commentId) => {
    setCommentToDelete(commentId);
    setIsDeleteCommentModalOpen(true);
  };

  const closeDeleteCommentModal = () => {
    setIsDeleteCommentModalOpen(false);
    setCommentToDelete(null);
  };

  const confirmDeleteComment = async () => {
    if (commentToDelete) {
      try {
        await shoutoutsAPI.deleteComment(commentToDelete);
        onUpdate();
        toast.success('Comment deleted successfully!');
      } catch (error) {
        console.error('Failed to delete comment:', error);
        toast.error('Failed to delete comment.');
      } finally {
        closeDeleteCommentModal();
      }
    }
  };
  
  const handleOpenReportModal = (shoutoutId, commentId = null) => {
    setReportingItem({ shoutoutId, commentId });
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = (reason) => {
    onReport(reportingItem.shoutoutId, reportingItem.commentId, reason);
    setIsReportModalOpen(false);
  };

  const handleOpenReactionViewer = () => {
    setShowReactionViewer(true);
  };

  const DeleteCommentConfirmationModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Comment</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this comment?
        </p>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={closeDeleteCommentModal}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteComment}
            className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />
      {isDeleteCommentModalOpen && <DeleteCommentConfirmationModal />}
      <div data-shoutout-id={shoutout.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-3">
            {shoutout.sender.profile_picture_url ? (
              <img
                src={`http://localhost:8000${shoutout.sender.profile_picture_url}`}
                alt="Sender Profile"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {shoutout.sender.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{shoutout.sender.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{shoutout.sender.department}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatTimestamp(shoutout.created_at)}
              </p>
            </div>
          </div>
          <DropdownMenu
            isOwnerOrAdmin={user?.role === 'admin' || user?.id === shoutout.sender.id}
            onDelete={() => onDelete(shoutout.id)}
            onReportClick={() => handleOpenReportModal(shoutout.id)}
            itemId={shoutout.id}
            currentUserRole={user?.role}
          />
        </div>

        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 mb-2">{shoutout.message}</p>
          <div className="flex flex-wrap gap-2">
            {shoutout.recipients.map((recipient) => (
              <Link
                to={`/users/${recipient.id}`}
                key={recipient.id}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm dark:bg-purple-900 dark:text-purple-300"
              >
                @{recipient.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-4 border-t pt-3 dark:border-gray-700">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={handleOpenReactionViewer}>
            {['like', 'clap', 'star'].map((type) => {
              const Icon = reactionIcons[type];
              const count = shoutout.reaction_counts.find((r) => r.type === type)?.count || 0;
              const isActive = shoutout.user_reaction === type;

              return (
                <button
                  key={type}
                  onClick={(e) => handleReaction(e, type)}
                  className={`flex items-center space-x-1 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'} hover:text-purple-600 dark:hover:text-purple-400 transition`}
                >
                  <Icon className={isActive ? 'text-purple-600 dark:text-purple-400' : ''} />
                  <span className="text-sm">{count}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-gray-500 hover:text-purple-600 text-sm ml-auto dark:text-gray-400 dark:hover:text-purple-400"
          >
            {shoutout.comments.length} {shoutout.comments.length === 1 ? 'Comment' : 'Comments'}
          </button>
        </div>

        {showComments && (
          <div className="border-t pt-4 dark:border-gray-700">
            <div className="space-y-3 mb-4">
              {shoutout.comments.map((comment) => (
                <div key={comment.id} data-comment-id={comment.id} className="flex items-start space-x-2">
                  {comment.user.profile_picture_url ? (
                    <img
                      src={`http://localhost:8000${comment.user.profile_picture_url}`}
                      alt="Commenter Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {comment.user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.user.name}</p>
                      <DropdownMenu
                        isOwnerOrAdmin={user?.role === 'admin' || user?.id === comment.user.id}
                        onDelete={() => openDeleteCommentModal(comment.id)}
                        onReportClick={() => handleOpenReportModal(shoutout.id, comment.id)}
                        itemId={comment.id}
                        currentUserRole={user?.role}
                      />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{parseMentions(comment.content)}</p>
                    <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                      {formatTimestamp(comment.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex space-x-2">
              <MentionsInput
                value={comment}
                onChange={(event, newValue) => setComment(newValue)}
                placeholder="Add a comment... (use @ to mention)"
                className="mentions"
                style={mentionStyle}
              >
                <Mention
                  trigger="@"
                  data={users}
                  markup="@[__display__](__id__)"
                  style={{ backgroundColor: '#dbeafe' }}
                  displayTransform={(id, display) => `@${display}`}
                />
              </MentionsInput>
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                Post
              </button>
            </form>
          </div>
        )}
        {showReactionViewer && (
          <ReactionViewer
            shoutoutId={shoutout.id}
            onClose={() => setShowReactionViewer(false)}
          />
        )}
      </div>
    </>
  );
}