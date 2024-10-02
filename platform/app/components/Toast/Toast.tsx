import React from 'react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type = 'info', onClose }) => {
  const bgColors = {
    info: 'bg-blue-100',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    error: 'bg-red-100',
  };

  const textColors = {
    info: 'text-blue-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    error: 'text-red-700',
  };

  return (
    <div className={`${bgColors[type]} p-4 rounded-lg shadow-lg mb-2`}>
      <p className={`${textColors[type]}`}>{message}</p>
      <button 
        onClick={() => onClose(id)} 
        className={`absolute top-2 right-2 ${textColors[type]} hover:${textColors[type]}`}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
