import { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaBullhorn, FaTrash, FaAward, FaStar } from 'react-icons/fa';
import { adminAPI, usersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersAPI.getUsers();
      setAllUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const fetchTopContributors = useCallback(async () => {
    try {
      const response = await adminAPI.getTopContributors();
      setTopContributors(response.data);
    } catch (error) {
      console.error('Failed to load top contributors:', error);
    }
  }, []);

  const fetchDeptStats = useCallback(async () => {
    try {
      const response = await adminAPI.getShoutoutsByDepartment();
      setDeptStats(response.data);
    } catch (error) {
      console.error('Failed to load department stats:', error);
    }
  }, []);

  const loadReports = useCallback(async (status = 'all') => {
    try {
      setReportsLoading(true);
      setReportsError(null);
      const params = {};
      if (status !== 'all') {
        params.status = status;
      }
      const { data } = await adminAPI.getReports(params);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      setReportsError('Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), fetchUsers(), fetchTopContributors(), fetchDeptStats(), loadReports()]);
  }, [fetchStats, fetchUsers, fetchTopContributors, fetchDeptStats, loadReports]);

  const handleRoleChange = async (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change the role of this user to ${newRole}?`)) {
      try {
        await adminAPI.updateUserRole(userId, newRole);
        fetchUsers();
      } catch (error) {
        console.error('Failed to update user role:', error);
        alert('Failed to update user role.');
      }
    }
  };

  const openDeleteUserModal = (user) => {
    setUserToDelete(user);
    setIsDeleteUserModalOpen(true);
  };

  const closeDeleteUserModal = () => {
    setIsDeleteUserModalOpen(false);
    setUserToDelete(null);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        await usersAPI.deleteUser(userToDelete.id);
        fetchUsers();
        fetchStats();
        toast.success(`User "${userToDelete.name}" deleted successfully!`);
      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error('Failed to delete user.');
      } finally {
        closeDeleteUserModal();
      }
    }
  };

  const handleReportFilterChange = (status) => {
    setReportStatusFilter(status);
    loadReports(status);
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      await adminAPI.updateReportStatus(reportId, newStatus);
      loadReports(reportStatusFilter);
    } catch (error) {
      console.error('Failed to update report status:', error);
      alert('Failed to update report status');
    }
  };

  const { most_recognized_users } = stats || {};

  const DeleteUserConfirmationModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm User Deletion</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete the user{' '}
          <span className="font-semibold">{userToDelete?.name}</span>? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={closeDeleteUserModal}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeleteUser}
            className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {isDeleteUserModalOpen && <DeleteUserConfirmationModal />}
      <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.total_users || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <FaUsers className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Shout-Outs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.total_shoutouts || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <FaBullhorn className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <FaAward className="mr-2 text-yellow-500" /> Top Contributors
          </h2>
          {topContributors.length > 0 ? (
            <ul className="space-y-4">
              {topContributors.map((user) => (
                <li key={user.id} className="flex items-center space-x-4">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={user.profile_picture_url ? `http://localhost:8000${user.profile_picture_url}` : `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                    alt={user.name}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.total_shoutouts_sent} shout-outs sent</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No data available.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <FaStar className="mr-2 text-yellow-400" /> Most Recognized
          </h2>
          {most_recognized_users && most_recognized_users.length > 0 ? (
            <ul className="space-y-4">
              {most_recognized_users.map((user) => (
                <li key={user.id} className="flex items-center space-x-4">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={user.profile_picture_url ? `http://localhost:8000${user.profile_picture_url}` : `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                    alt={user.name}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.count} times recognized</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No data available.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Shoutouts by Department</h2>
          {deptStats.length > 0 ? (
            <ul className="space-y-3">
              {deptStats.map((d) => (
                <li
                  key={d.department}
                  className="bg-gray-100 dark:bg-gray-700 py-4 px-5 rounded-xl shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 flex justify-between items-center"
                >
                  <span className="font-bold text-gray-800 dark:text-white">{d.department}</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{d.shoutout_count} shout-outs</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No data available.</p>
          )}
        </div>
      </div>

      <section className="mt-6 bg-white rounded-xl shadow-sm p-4 dark:bg-gray-800 dark:text-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Reports</h2>
          <div className="flex gap-2 text-sm">
            {['all', 'pending', 'reviewed', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => handleReportFilterChange(status)}
                className={`px-3 py-1 rounded-full border ${
                  reportStatusFilter === status
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                }`}
              >
                {status === 'all'
                  ? 'All'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {reportsLoading && (
          <p className="text-sm text-gray-500">Loading reports...</p>
        )}

        {reportsError && (
          <p className="text-sm text-red-500">{reportsError}</p>
        )}

        {!reportsLoading && !reportsError && reports.length === 0 && (
          <p className="text-sm text-gray-500">No reports found.</p>
        )}

        {!reportsLoading && !reportsError && reports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-fixed">
              <thead>
                <tr className="border-b text-gray-500 dark:text-gray-400">
                  <th className="py-2 pr-4 text-left">Report ID</th>
                  <th className="py-2 pr-4 text-left">Type</th>
                  <th className="py-2 pr-4 text-left">Reason</th>
                  <th className="py-2 pr-4 text-left">Reported By</th>
                  <th className="py-2 pr-4 text-left">Status</th>
                  <th className="py-2 pr-4 text-left">Created At</th>
                  <th className="py-2 pr-4 text-middle">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const { id, comment_id, reason, reported_by, status, created_at, shoutout_id } = report;

                  return (
                    <tr key={id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-gray-900 dark:text-gray-100 text-left">
                        #{id}
                      </td>
                      <td className="py-2 pr-4 text-left">
                        {comment_id ? "Comment" : "Shout-out"}
                      </td>
                      <td className="py-2 pr-4 max-w-xs truncate text-left" title={reason}>
                        {reason}
                      </td>
                      <td className="py-2 pr-4 text-left">
                        {reported_by?.name || "Unknown"}
                      </td>
                      <td className="py-2 pr-4 capitalize text-left">
                        {status}
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-500 text-left">
                        {created_at
                          ? new Date(created_at).toLocaleString()
                          : ""}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="min-w-[140px] text-center">
                            {report.status === "pending" && (
                              <button
                                onClick={() => updateReportStatus(report.id, "reviewed")}
                                className="px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 w-full"
                              >
                                Mark as reviewed
                              </button>
                            )}
                            {report.status === "reviewed" && (
                              <button
                                onClick={() => updateReportStatus(report.id, "resolved")}
                                className="px-2 py-1 text-xs rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 w-full"
                              >
                                Mark as resolved
                              </button>
                            )}
                            {report.status === "resolved" && (
                              <span className="px-2 py-1 text-xs rounded-md bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 w-full inline-block">
                                Resolved
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => navigate('/dashboard', { state: { highlightShoutoutId: report.shoutout_id } })}
                            className="min-w-[110px] text-center px-2 py-1 text-xs rounded-md bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                          >
                            View Shoutout
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* User Management Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">User Management</h2>
        {allUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {allUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-.center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {u.profile_picture_url ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={`http://localhost:8000${u.profile_picture_url}`} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                              {u.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{u.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:border-gray-600 dark:text-gray-100"
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openDeleteUserModal(u)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600 ml-4"
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No users found.</p>
        )}
      </div>
    </div>
  );
}