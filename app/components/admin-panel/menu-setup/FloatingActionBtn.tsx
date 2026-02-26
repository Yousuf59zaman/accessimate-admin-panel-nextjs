"use client";

import React from "react";

interface FloatingActionBtnProps {
  icon: string;
  loader: boolean;
  onClick: () => void;
}

export default function FloatingActionBtn({ icon, loader, onClick }: FloatingActionBtnProps) {
  return (
    <div className="w-full flex justify-end mt-3">
      {loader ? (
        <button
          disabled
          className="w-[50px] h-[50px] rounded-full bg-gray-400 text-white shadow-lg flex items-center justify-center cursor-not-allowed"
        >
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </button>
      ) : (
        <button
          onClick={onClick}
          className="w-[50px] h-[50px] rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-green-600 hover:shadow-xl"
        >
          <i className={icon} />
        </button>
      )}
    </div>
  );
}
