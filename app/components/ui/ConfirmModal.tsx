"use client";

import React, { useState } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

/**
 * ConfirmModal — Replaces Nuxt's ConfirmModal.vue
 *
 * Usage:
 *   <ConfirmModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[25rem] max-w-[90vw] p-6 transform transition-all animate-modal-enter">
        {/* Warning icon */}
        <div className="flex justify-center">
          <div className="f-modal-alert">
            <div className="f-modal-icon f-modal-warning scaleWarning">
              <span className="f-modal-body pulseWarningIns" />
              <span className="f-modal-dot pulseWarningIns" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6 mt-2 text-center">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            Are you sure you want to proceed?
          </h3>
        </div>

        {/* Buttons */}
        <div className="flex justify-end items-center gap-3">
          {isLoading ? (
            <div className="flex items-center justify-center w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded-md">
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-red-500 rounded-md transition-all duration-300 hover:scale-105 hover:bg-red-600 flex items-center gap-2"
              >
                <i className="pi pi-times-circle" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-blue-500 rounded-md transition-all duration-300 hover:scale-105 hover:shadow-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <i className="pi pi-check-circle" />
                Yes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
