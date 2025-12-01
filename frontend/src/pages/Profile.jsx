import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, shoutoutsAPI } from '../services/api'; // Added shoutoutsAPI
import ShoutoutCard from '../components/ShoutoutCard';
import { FaPencilAlt } from 'react-icons/fa';
import TaggedMe from './TaggedMe';
import toast from 'react-hot-toast'; // Added toast

const Profile = () => {
  const { user, setUser, token, setToken } = useAuth();
  const [shoutouts, setShoutouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // New state for delete modal
  const [shoutoutToDelete, setShoutoutToDelete] = useState(null); // New state for shoutout to delete
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('my-shoutouts');

  const loadMyShoutouts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getMyShoutouts();
      setShoutouts(response.data);
    } catch (error) {
      console.error('Failed to load my shout-outs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      if (activeTab === 'my-shoutouts') {
        loadMyShoutouts();
      }
    }
  }, [user, activeTab, loadMyShoutouts]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const { name, current_password, new_password, confirm_password } = formData;
    
    let updateData = { name };

    if (new_password) {
      if (new_password !== confirm_password) {
        alert("New passwords don't match.");
        return;
      }
      if (!current_password) {
        alert('Please enter your current password to set a new one.');
        return;
      }
      updateData.new_password = new_password;
      updateData.current_password = current_password;
    }

    try {
      const res = await usersAPI.updateMe(updateData, token);
      setUser(res.data.user);
      if (res.data.access_token) {
        setToken(res.data.access_token);
      }
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.detail || 'Failed to update profile.');
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadData = new FormData();
      uploadData.append('file', file);
      try {
        const res = await usersAPI.uploadProfilePicture(uploadData, token);
        setUser(res.data);
      } catch (error) {
        console.error('Failed to upload profile picture:', error);
      } 
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      const res = await usersAPI.deleteProfilePicture(token);
      setUser(res.data);
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
    }
  };

  // Renamed from handleDelete to openDeleteModal
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

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Deletion</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete this shoutout?
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
    <div className="container mx-auto p-4">
      {isDeleteModalOpen && <DeleteConfirmationModal />}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Edit Profile
        </button>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleProfilePictureChange}
            className="hidden"
          />
          <div className="relative w-32 h-32 mx-auto rounded-full border-2 border-gray-400 dark:border-gray-600">
            {user?.profile_picture_url ? (
              <img
                src={`http://localhost:8000${user.profile_picture_url}`}
                alt="Profile"
                className="rounded-full w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                {user?.name?.charAt(0)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 bg-gray-800 rounded-full p-2 text-white hover:bg-gray-700"
              title="Change Profile Picture"
            >
              <FaPencilAlt size={16} />
            </button>
          </div>
          <h2 className="text-xl font-semibold mt-4 text-gray-900 dark:text-gray-100">{user?.name}</h2>
          <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
          {user?.profile_picture_url && (
            <button
              onClick={handleDeleteProfilePicture}
              className="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
            >
              Delete Photo
            </button>
          )}
        </div>
        <div className="md:w-2/3 md:pl-8">
          <div className="flex border-b border-gray-300 dark:border-gray-700 mb-4">
            <button
              onClick={() => setActiveTab('my-shoutouts')}
              className={`py-2 px-4 text-lg font-medium ${
                activeTab === 'my-shoutouts'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              My Shoutouts
            </button>
            <button
              onClick={() => setActiveTab('tagged-me')}
              className={`py-2 px-4 text-lg font-medium ${
                activeTab === 'tagged-me'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Tagged Me
            </button>
          </div>
          {activeTab === 'my-shoutouts' ? (
            loading ? (
              <p className="text-gray-600 dark:text-gray-300">Loading shoutouts...</p>
            ) : (
              <div>
                {shoutouts.map((shoutout) => (
                  <ShoutoutCard
                    key={shoutout.id}
                    shoutout={shoutout}
                    onUpdate={loadMyShoutouts}
                    onDelete={openDeleteModal}
                    allowUserDelete={true}
                  />
                ))}
              </div>
            )
          ) : (
            <TaggedMe />
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                />
              </div>

              <hr className="my-6 border-gray-300 dark:border-gray-600" />
              
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Change Password</h3>
              
              <div className="mb-4">
                <label
                  htmlFor="current_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Current Password
                </label>
                <input
                  type="password"
                  id="current_password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="new_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="new_password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="confirm_password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-600 dark:text-gray-300 mr-4"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;