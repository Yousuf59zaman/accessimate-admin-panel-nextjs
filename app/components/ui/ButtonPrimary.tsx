import React from 'react';

interface ButtonPrimaryProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function ButtonPrimary({ children, className = '', ...props }: ButtonPrimaryProps) {
  return (
    <button
      className={`flex items-center px-4 py-2 bg-[#1B92D9] border border-transparent font-semibold text-white uppercase tracking-widest hover:bg-[#1B92D9] focus:bg-[#1B92D9] active:bg-[#1B92D9] focus:outline-none focus:ring-2 focus:ring-[#1B92D9] focus:ring-offset-2 transition ease-in-out duration-150 justify-center rounded-[64px] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
