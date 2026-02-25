"use client";

import React from "react";
import { useTheme } from "next-themes";

export default function ColorModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-5 h-5" />;
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <div className="px-2 color_mode">
      {currentTheme === "dark" ? (
        <button
          title="Switch to Light"
          onClick={() => setTheme("light")}
          className="focus:outline-none"
        >
          <i className="fas fa-moon w-5 h-5 text-white cursor-pointer text-base" />
        </button>
      ) : (
        <button
          title="Switch to Dark"
          onClick={() => setTheme("dark")}
          className="focus:outline-none"
        >
          <i className="fas fa-sun w-5 h-5 cursor-pointer text-base" />
        </button>
      )}
    </div>
  );
}
