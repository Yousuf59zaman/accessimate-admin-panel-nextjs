import React from 'react';

interface InputErrorProps {
  message?: string;
}

export default function InputError({ message }: InputErrorProps) {
  if (!message) return null;

  return (
    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
      {message}
    </p>
  );
}
