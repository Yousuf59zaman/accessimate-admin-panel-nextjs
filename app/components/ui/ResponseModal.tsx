"use client";

import React, { useEffect, useMemo, useState } from "react";

interface ResponseModalData {
  status?: boolean;
  message?: string;
  error?: Record<string, string[]>;
}

interface ResponseModalProps {
  data: ResponseModalData;
  onClose?: () => void;
}

/**
 * ResponseModal — Replaces Nuxt's ResponseModal.vue
 *
 * Usage:
 *   <ResponseModal data={responseModal} onClose={() => setResponseModal({})} />
 */
export default function ResponseModal({ data, onClose }: ResponseModalProps) {
  const [visible, setVisible] = useState(false);

  // Show modal when data changes and has content, auto-close after 3s
  useEffect(() => {
    const hasData = data && Object.keys(data).length > 0;
    if (hasData) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const messageLogs = useMemo(() => {
    const msgs: string[] = [];
    if (data.error) {
      for (const value of Object.values(data.error)) {
        msgs.push(...value);
      }
    }
    return msgs;
  }, [data.error]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[25rem] max-w-[90vw] p-6 transform transition-all animate-modal-enter">
        <div className="flex flex-wrap px-3">
          <div className="flex items-start w-full justify-center">
            {/* Success state */}
            {data.status === true && (
              <div className="flex flex-col items-center justify-center w-full">
                <div
                  className="ui-success"
                  style={{ width: 100, height: 100, margin: 15 }}
                >
                  <svg
                    viewBox="0 0 87 87"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g
                      stroke="none"
                      strokeWidth="1"
                      fill="none"
                      fillRule="evenodd"
                    >
                      <g transform="translate(2.000000, 2.000000)">
                        <circle
                          stroke="rgba(165, 220, 134, 0.2)"
                          strokeWidth="4"
                          cx="41.5"
                          cy="41.5"
                          r="41.5"
                        />
                        <circle
                          className="ui-success-circle"
                          stroke="#A5DC86"
                          strokeWidth="4"
                          cx="41.5"
                          cy="41.5"
                          r="41.5"
                        />
                        <polyline
                          className="ui-success-path"
                          stroke="#A5DC86"
                          strokeWidth="4"
                          points="19 38.8036813 31.1020744 54.8046875 63.299221 28"
                        />
                      </g>
                    </g>
                  </svg>
                </div>
                <p className="text-green-700 text-lg font-medium dark:text-green-400 text-wrap pb-2 text-center">
                  {data.message}
                </p>
              </div>
            )}

            {/* Error state */}
            {data.status === false && (
              <div className="flex flex-col items-center justify-center w-full">
                <div
                  className="ui-error"
                  style={{ width: 100, height: 100, margin: 15 }}
                >
                  <svg
                    viewBox="0 0 87 87"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g
                      stroke="none"
                      strokeWidth="1"
                      fill="none"
                      fillRule="evenodd"
                    >
                      <g transform="translate(2.000000, 2.000000)">
                        <circle
                          stroke="rgba(252, 191, 191, .5)"
                          strokeWidth="4"
                          cx="41.5"
                          cy="41.5"
                          r="41.5"
                        />
                        <circle
                          className="ui-error-circle"
                          stroke="#F74444"
                          strokeWidth="4"
                          cx="41.5"
                          cy="41.5"
                          r="41.5"
                        />
                        <path
                          className="ui-error-line1"
                          d="M22.244224,22 L60.4279902,60.1837662"
                          stroke="#F74444"
                          strokeWidth="3"
                          strokeLinecap="square"
                        />
                        <path
                          className="ui-error-line2"
                          d="M60.755776,21 L23.244224,59.8443492"
                          stroke="#F74444"
                          strokeWidth="3"
                          strokeLinecap="square"
                        />
                      </g>
                    </g>
                  </svg>
                </div>
                <p className="text-red-700 text-lg font-medium dark:text-red-400 text-wrap pb-2 text-center">
                  {data.message}
                </p>
              </div>
            )}

            {/* Validation error messages */}
            {messageLogs.length > 0 && (
              <div className="text-start w-full mt-2">
                {messageLogs.map((msg, index) => (
                  <p
                    key={index}
                    className="text-red-700 text-sm font-medium dark:text-red-400 text-wrap pb-1"
                  >
                    • {msg}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
