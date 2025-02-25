// components/UI/StatusMessage.js
import React from 'react';

const StatusMessage = ({ message }) => {
  if (!message.text) return null;
  
  const getMessageStyle = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border border-blue-300';
    }
  };
  
  return (
    <div className={`mb-4 p-3 rounded-md ${getMessageStyle(message.type)}`}>
      {message.text}
    </div>
  );
};

export default StatusMessage;