import React from 'react';

export const Header = ({ onClose }) => (
  <div className="self-start bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 p-4 rounded-lg shadow-md flex justify-between items-center w-auto min-w-[300px] relative">
    <div>
      <h1 className="font-black text-xl text-white">Avatar</h1>
      <p className="text-white">My virtual assistant always here to assist you 💙</p>
    </div>
    <button 
      onClick={onClose}
      className="pointer-events-auto text-white hover:text-gray-200 focus:outline-none absolute -top-3 -right-3 bg-red-500 rounded-full p-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);