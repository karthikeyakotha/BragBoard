import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import ShoutoutCard from '../components/ShoutoutCard';

const TaggedMe = () => {
    const [shoutouts, setShoutouts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTaggedShoutouts = async () => {
        setLoading(true);
        try {
            const response = await usersAPI.getTaggedShoutouts();
            setShoutouts(response.data);
        } catch (error) {
            console.error('Failed to load tagged shoutouts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaggedShoutouts();
    }, []);
    
    const handleUpdateShoutout = () => {
        fetchTaggedShoutouts();
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Tagged In</h2>
            {shoutouts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">You haven't been tagged in any shoutouts yet.</p>
            ) : (
                <div className="space-y-4">
                    {shoutouts.map((shoutout) => (
                        <ShoutoutCard
                            key={shoutout.id}
                            shoutout={shoutout}
                            onUpdate={handleUpdateShoutout}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaggedMe;
