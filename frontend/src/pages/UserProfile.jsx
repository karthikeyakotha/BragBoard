import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { shoutoutsAPI, usersAPI } from '../services/api';
import ShoutoutCard from '../components/ShoutoutCard';

const UserProfile = () => {
  const { id } = useParams();
  // const { user: currentUser } = useAuth(); // Rename current user to avoid conflict
  const [profileUser, setProfileUser] = useState(null);
  const [shoutouts, setShoutouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shoutoutsLoading, setShoutoutsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const response = await usersAPI.getUser(id);
        setProfileUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setProfileUser(null); // Set to null if user not found
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  const loadUserShoutouts = useCallback(async () => {
    if (!profileUser) return;

    setShoutoutsLoading(true);
    try {
      const response = await shoutoutsAPI.getAll({ sender_id: profileUser.id });
      const userShoutouts = response.data.filter(s => s.sender.id === profileUser.id);
      setShoutouts(userShoutouts);
    } catch (error) {
      console.error('Failed to load user shout-outs:', error);
    } finally {
      setShoutoutsLoading(false);
    }
  }, [profileUser]);

  useEffect(() => {
    if (profileUser) {
      loadUserShoutouts();
    }
  }, [profileUser, loadUserShoutouts]);

  const handleDelete = (shoutoutId) => {
    setShoutouts(shoutouts.filter((s) => s.id !== shoutoutId));
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center text-gray-600 dark:text-gray-300">Loading user profile...</div>;
  }

  if (!profileUser) {
    return <div className="container mx-auto p-4 text-center text-red-600 dark:text-red-400">User not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 text-center">
          <div className="relative w-32 h-32 mx-auto rounded-full border-2 border-gray-400 dark:border-gray-600">
            {profileUser?.profile_picture_url ? (
              <img
                src={`http://localhost:8000${profileUser.profile_picture_url}`}
                alt="Profile"
                className="rounded-full w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                {profileUser?.name?.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold mt-4 text-gray-900 dark:text-gray-100">{profileUser?.name}</h2>
          <p className="text-gray-600 dark:text-gray-300">{profileUser?.email}</p>
          <p className="text-gray-600 dark:text-gray-300">{profileUser?.department}</p>
        </div>
        <div className="md:w-2/3 md:pl-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Shoutouts by {profileUser.name}</h3>
          {shoutoutsLoading ? (
            <p className="text-gray-600 dark:text-gray-300">Loading shoutouts...</p>
          ) : (
            <div>
              {shoutouts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No shoutouts found for this user.</p>
              ) : (
                shoutouts.map((shoutout) => (
                  <ShoutoutCard
                    key={shoutout.id}
                    shoutout={shoutout}
                    onUpdate={() => loadUserShoutouts()}
                    onDelete={handleDelete}
                    allowUserDelete={true}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
