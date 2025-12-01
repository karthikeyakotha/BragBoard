import { useState } from 'react';

export default function ReportModal({ isOpen, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Reason cannot be empty.');
      return;
    }
    onSubmit(reason);
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Why are you reporting this?</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full h-32 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          placeholder="Please provide a reason for reporting..."
        ></textarea>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleClose}
            className="text-gray-600 dark:text-gray-300 mr-4 px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}
