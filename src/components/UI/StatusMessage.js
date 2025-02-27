// components/UI/StatusMessage.js
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';

const StatusMessage = ({ message }) => {
  const [visible, setVisible] = useState(false);
  const [exit, setExit] = useState(false);

  // Wenn eine neue Nachricht kommt, zeige sie an
  useEffect(() => {
    if (message.text) {
      setVisible(true);
      setExit(false);
      
      // Automatisch ausblenden nach 4 Sekunden
      const timer = setTimeout(() => {
        setExit(true);
        
        // Warte auf Animation, bevor visible auf false gesetzt wird
        setTimeout(() => {
          setVisible(false);
        }, 500);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Wenn keine Nachricht oder die Nachricht nicht sichtbar sein soll, nichts rendern
  if (!message.text || !visible) {
    return null;
  }
  
  const getMessageIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <XCircle className="text-blue-500" size={20} />;
    }
  };

  const getMessageStyle = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  const handleClose = () => {
    setExit(true);
    setTimeout(() => {
      setVisible(false);
    }, 500);
  };

  return (
    <div 
      className={`fixed bottom-4 inset-x-0 mx-auto w-full max-w-sm z-50 px-4 transition-all duration-500 ${
        exit ? 'opacity-0 translate-y-12' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className={`flex items-center justify-between p-3 rounded-lg shadow-lg border ${getMessageStyle(message.type)}`}>
        <div className="flex items-center">
          {getMessageIcon(message.type)}
          <span className="ml-2 text-sm font-medium">{message.text}</span>
        </div>
        <button 
          onClick={handleClose}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default StatusMessage;