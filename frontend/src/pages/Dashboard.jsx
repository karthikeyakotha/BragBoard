import { useState, useEffect, useCallback } from 'react';
import { FaPlus } from 'react-icons/fa';
import { shoutoutsAPI, usersAPI } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import ShoutoutCard from '../components/ShoutoutCard';
import CreateShoutout from '../components/CreateShoutout';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [shoutouts, setShoutouts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({ department: '', senderId: '', startDate: '' });
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [reportMessage, setReportMessage] = useState('');
  const [reportError, setReportError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [shoutoutToDelete, setShoutoutToDelete] = useState(null);

  const { highlightShoutoutId, highlightCommentId } = location.state || {};

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersAPI.getUsers();
        setAllUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users for filter:', error);
      }
    };
    fetchUsers();
  }, []);

  const loadShoutouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.senderId) params.sender_id = filters.senderId;
      if (filters.startDate) params.start_date = filters.startDate;
      
      const response = await shoutoutsAPI.getAll(params);
      setShoutouts(response.data);
    } catch (error) {
      console.error('Failed to load shout-outs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadShoutouts();
  }, [filters, location.search, loadShoutouts]);

  useEffect(() => {
    if (!shoutouts || shoutouts.length === 0) return;

    if (highlightCommentId) {
      const el = document.querySelector(`[data-comment-id="${highlightCommentId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-amber-400');
        setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2000);
      }
    } else if (highlightShoutoutId) {
      const el = document.querySelector(`[data-shoutout-id="${highlightShoutoutId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-amber-400');
        setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2000);
      }
    }

    if (highlightShoutoutId || highlightCommentId) {
      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
  }, [highlightShoutoutId, highlightCommentId, shoutouts, navigate, location.pathname]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadShoutouts();
  };

  const openDeleteModal = (id) => {
    setShoutoutToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setShoutoutToDelete(null);
  };

  const confirmDelete = async () => {
    if (shoutoutToDelete) {
      try {
        await shoutoutsAPI.delete(shoutoutToDelete);
        setShoutouts(shoutouts.filter((s) => s.id !== shoutoutToDelete));
        toast.success('Shoutout deleted successfully!');
      } catch (error) {
        console.error('Failed to delete shout-out:', error);
        toast.error('Failed to delete shoutout.');
      } finally {
        closeDeleteModal();
      }
    }
  };

  const handleReport = async (shoutoutId, commentId = null, reason) => {
    try {
      if (!reason) return;
      const res = await shoutoutsAPI.report(shoutoutId, commentId, reason);
      const msg = res?.data?.message || "Your report has been submitted and sent to the admin.";
      setReportMessage(msg);
      setTimeout(() => setReportMessage(''), 4000);
    } catch (err) {
      console.error("Failed to report:", err);
      setReportError("Something went wrong while reporting. Please try again.");
      setTimeout(() => setReportError(''), 4000);
    }
  };

  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Product'];

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Deletion</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this shoutout? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={closeDeleteModal}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
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
      {(reportMessage || reportError) && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${
            reportError ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {reportMessage || reportError}
        </div>
      )}

      {isDeleteModalOpen && <DeleteConfirmationModal />}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition flex items-center justify-center space-x-2 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              <FaPlus />
              <span>Create Shout-Out</span>
            </button>
          ) : (
            <CreateShoutout
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6 dark:bg-gray-800">
          <h3 className="font-semibold text-gray-900 mb-3 dark:text-gray-100">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                Colleauges
              </label>
              <select
                value={filters.senderId}
                onChange={(e) => setFilters({ ...filters, senderId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="">All Colleauges</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shout-outs...</p>
          </div>
        ) : shoutouts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">No shout-outs yet. Be the first to create one!</p>
          </div>
        ) : (
          <div>
            {shoutouts.map((shoutout) => (
              <ShoutoutCard
                key={shoutout.id}
                shoutout={shoutout}
                onUpdate={loadShoutouts}
                onDelete={openDeleteModal}
                onReport={handleReport}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}