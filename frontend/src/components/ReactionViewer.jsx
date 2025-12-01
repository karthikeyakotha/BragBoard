import React, { useState, useEffect } from 'react';
import { shoutoutsAPI } from '../services/api';

const ReactionViewer = ({ shoutoutId, onClose }) => {
    const [reactions, setReactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState('');

    const reactionTypes = ['like', 'clap', 'star'];
    const reactionEmojis = {
        like: '❤️',
        clap: '👏',
        star: '⭐',
    };

    useEffect(() => {
        const fetchReactions = async () => {
            setLoading(true);
            try {
                const response = await shoutoutsAPI.getShoutoutReactions(shoutoutId, {
                    page,
                    limit: 10,
                    type: filter || undefined,
                });
                setReactions(prev => (page === 1 ? response.data : [...prev, ...response.data]));
                setHasMore(response.data.length > 0);
            } catch (error) {
                console.error('Failed to fetch reactions:', error);
            } finally {
                setLoading(false);
            }
        };

        if (shoutoutId) {
            fetchReactions();
        }
    }, [shoutoutId, page, filter]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setPage(1);
        setReactions([]);
    };

    const groupedReactions = reactions.reduce((acc, reaction) => {
        (acc[reaction.type] = acc[reaction.type] || []).push(reaction);
        return acc;
    }, {});

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reactions</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">&times;</button>
                </div>

                <div className="flex space-x-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <button onClick={() => handleFilterChange('')} className={`px-3 py-1 rounded-full text-sm ${!filter ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>All</button>
                    {reactionTypes.map(type => (
                        <button key={type} onClick={() => handleFilterChange(type)} className={`px-3 py-1 rounded-full text-sm ${filter === type ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            {reactionEmojis[type]}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {Object.entries(groupedReactions).map(([type, reactions]) => (
                        <div key={type}>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                                {reactionEmojis[type]} <span className="ml-2">{type.charAt(0).toUpperCase() + type.slice(1)}s</span>
                            </h3>
                            <ul className="space-y-3">
                                {reactions.map(reaction => (
                                    <li key={reaction.user.id} className="flex items-center space-x-3">
                                {reaction.user.profile_picture_url ? (
                                            <img
                                                src={`http://localhost:8000${reaction.user.profile_picture_url}`}
                                                alt="User Profile"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                {reaction.user.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white">{reaction.user.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{reaction.user.department}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {loading && <p className="text-center">Loading...</p>}

                    {!loading && hasMore && (
                        <button
                            onClick={() => setPage(prev => prev + 1)}
                            className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                            Show More
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReactionViewer;
