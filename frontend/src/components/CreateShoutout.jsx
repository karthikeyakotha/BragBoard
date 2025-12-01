import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { shoutoutsAPI, usersAPI } from '../services/api';

export default function CreateShoutout({ onSuccess, onCancel }) {
  const [message, setMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNoUserMessage, setShowNoUserMessage] = useState(false);
  
    useEffect(() => {
      usersAPI.getUsers().then((response) => {
        setUsers(response.data);
      });
    }, []);
  
    const filteredUsers = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedRecipients.find((r) => r.id === user.id)
    );
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!message.trim() || selectedRecipients.length === 0) return;
  
      setLoading(true);
      try {
        await shoutoutsAPI.create({
          message,
          recipient_ids: selectedRecipients.map((r) => r.id),
        });
        setMessage('');
        setSelectedRecipients([]);
        onSuccess();
      } catch (error) {
        console.error('Failed to create shout-out:', error);
        alert('Failed to create shout-out. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    const addRecipient = (user) => {
      setSelectedRecipients([...selectedRecipients, user]);
      setSearchTerm('');
      setShowNoUserMessage(false);
    };
  
    const removeRecipient = (userId) => {
      setSelectedRecipients(selectedRecipients.filter((r) => r.id !== userId));
    };
  
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredUsers.length === 1) {
          addRecipient(filteredUsers[0]);
        } else {
          setShowNoUserMessage(true);
        }
      }
    };
  
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create a Shout-Out</h3>
  
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Who do you want to recognize?
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowNoUserMessage(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search for colleagues..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
              {showNoUserMessage && (
                <p className="text-red-500 text-xs mt-1">Please select a colleague from the list.</p>
              )}
              {searchTerm && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto dark:bg-gray-700 dark:border-gray-600">
                  {filteredUsers.slice(0, 5).map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addRecipient(user)}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900 flex items-center space-x-2"
                    >
                      {user.profile_picture_url ? (
                        <img
                          src={`http://localhost:8000${user.profile_picture_url}`}
                          alt="User Profile"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.department}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
  
            {selectedRecipients.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRecipients.map((recipient) => (
                  <span
                    key={recipient.id}
                    className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2 dark:bg-purple-900 dark:text-purple-300"
                  >
                    <span>@{recipient.name}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(recipient.id)}
                      className="text-purple-900 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-100"
                    >
                      <FaTimes size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Your message
                      </label>
                      <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Share why you appreciate them..."
                          rows="4"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      />
                  </div>
  
                  <div className="flex space-x-3">
                      <button
                          type="submit"
                          disabled={loading || !message.trim() || selectedRecipients.length === 0}
                          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition dark:bg-purple-500 dark:hover:bg-purple-600"
                      >
                          {loading ? 'Posting...' : 'Post Shout-Out'}
                      </button>
                      {onCancel && (
                          <button
                              type="button"
                              onClick={onCancel}
                              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-100"
                          >
                              Cancel
                          </button>
                      )}
                  </div>
              </form>
          </div>
      );
  }