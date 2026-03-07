"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import fontLibrary from "@/app/lib/json/fonts";
import "@/app/assets/css/icon-style.css";

interface IconVariant {
  title: string;
  icons: string[];
}

interface IconPickerProps {
  label?: string;
  isOpen?: boolean; // We support isOpen for NextJS AddEdit toggling
  isOpenPicker?: boolean; // The Nuxt code had isOpenPicker
  value?: string;
  modelValue?: string;
  onClose: () => void;
  onChange?: (icon: string) => void;
  "onUpdate:modelValue"?: (icon: string) => void;
}

export default function IconPicker({
  label = "Pick Your Icon",
  isOpen,
  isOpenPicker,
  value,
  modelValue,
  onClose,
  onChange,
  "onUpdate:modelValue": onUpdateModelValue,
}: IconPickerProps) {
  // Hydration bypass standard
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  // Support both NextJS and old Nuxt prop structures
  const isVisible = isOpen || isOpenPicker || false;
  const currentValue = value || modelValue || "fas fa-upload";

  const tabs = useMemo(
    () => [
      {
        id: "all",
        title: "All Icons",
        icon: "fas fa-star-of-life",
        link: "all",
      },
      {
        id: "far",
        title: "Font Awesome Regular",
        icon: "fab fa-font-awesome-alt",
        link: fontLibrary.fontAwesome.variants.regular,
      },
      {
        id: "fas",
        title: "Font Awesome Solid",
        icon: "fab fa-font-awesome",
        link: fontLibrary.fontAwesome.variants.solid,
      },
      {
        id: "fab",
        title: "Font Awesome Brands",
        icon: "fab fa-font-awesome-flag",
        link: fontLibrary.fontAwesome.variants.brands,
      },
      ...(fontLibrary.fontAwesome.variants.social
        ? [
            {
              id: "social",
              title: "Social Icons",
              icon: "fab fa-facebook",
              link: fontLibrary.fontAwesome.variants.social,
            },
          ]
        : []),
    ],
    [],
  );

  const [filterText, setFilterText] = useState("");
  const [activeGlyph, setActiveGlyph] = useState(currentValue);
  const [activeTabId, setActiveTabId] = useState("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef<string | null>(null);

  const allGlyphs = useMemo(() => {
    let combined: string[] = [];
    tabs.forEach((tab) => {
      if (tab.link !== "all" && (tab.link as unknown as IconVariant).icons) {
        combined = combined.concat((tab.link as unknown as IconVariant).icons);
      }
    });
    return combined;
  }, [tabs]);

  const scrollToSelectedIcon = (iconClass: string) => {
    const container = scrollContainerRef.current;
    if (container) {
      const selectedIcon = container.querySelector(
        `[data-glyph="${iconClass}"]`,
      ) as HTMLElement;
      if (selectedIcon) {
        const containerRect = container.getBoundingClientRect();
        const iconRect = selectedIcon.getBoundingClientRect();
        const scrollTop =
          selectedIcon.offsetTop -
          container.offsetTop -
          containerRect.height / 2 +
          iconRect.height / 2;
        container.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    }
  };

  useEffect(() => {
    if (isVisible && currentValue && prevValueRef.current !== currentValue) {
      prevValueRef.current = currentValue;

      let foundTab = tabs[0];
      for (let i = 1; i < tabs.length; i++) {
        const tab = tabs[i];
        if (
          tab.link !== "all" &&
          (tab.link as unknown as IconVariant).icons &&
          (tab.link as unknown as IconVariant).icons.includes(currentValue)
        ) {
          foundTab = tab;
          break;
        }
      }
      // eslint-disable-next-line
      setActiveTabId(foundTab.id);
      setTimeout(() => {
        scrollToSelectedIcon(currentValue);
      }, 100);
    }
    // Note: Intentional mount configuration, deliberately ignoring scrolling deps
  }, [isVisible, currentValue, tabs]);

  const glyphs = useMemo(() => {
    let _glyphs: string[] = [];
    const activeTab = tabs.find((t) => t.id === activeTabId);

    if (activeTab && activeTab.id !== "all") {
      _glyphs = (activeTab.link as unknown as IconVariant).icons || [];
    } else {
      _glyphs = allGlyphs;
    }

    if (filterText !== "") {
      const _filterText = filterText.toLowerCase();
      _glyphs = _glyphs.filter(
        (item) =>
          item.substring(7).toLowerCase().startsWith(_filterText) ||
          item.toLowerCase().includes(_filterText),
      );
    }
    return _glyphs;
  }, [activeTabId, filterText, allGlyphs, tabs]);

  const getGlyphName = (glyph: string) => {
    return glyph.replace(/f.. fa-/g, "").replace("-", " ");
  };

  const handleInsert = () => {
    // If the user hasn't actively clicked a new glyph, fallback to currentValue
    // to prevent submitting an empty or stale string when just clicking insert
    const valueToSubmit = activeGlyph || currentValue;
    if (onChange) onChange(valueToSubmit);
    if (onUpdateModelValue) onUpdateModelValue(valueToSubmit);
    onClose();
  };

  if (!mounted || !isVisible) return null;

  const content = (
    <div className="aim-modal aim-open" style={{ zIndex: 100000 }}>
      <div className="aim-modal--content">
        <div className="aim-modal--header">
          <div className="aim-modal--header-logo-area">
            <span className="aim-modal--header-logo-title">{label}</span>
          </div>
          <div
            className="aim-modal--header-close-btn"
            onClick={onClose}
            style={{ cursor: "pointer" }}
          >
            <i className="fas fa-times" title="Close"></i>
          </div>
        </div>
        <div className="aim-modal--body">
          <div className="aim-modal--sidebar">
            <div className="aim-modal--sidebar-tabs">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`aim-modal--sidebar-tab-item ${activeTabId === tab.id ? "aesthetic-active" : ""}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.title}</span>
                </div>
              ))}
            </div>
            <div
              className="aim-sidebar-preview"
              style={{ cursor: "pointer" }}
              onClick={() => scrollToSelectedIcon(activeGlyph)}
            >
              <div className="aim-icon-item ">
                <div className="aim-icon-item-inner">
                  <i
                    className={activeGlyph}
                    style={{
                      fontSize: "120px",
                      display: "inline-block",
                      paddingTop: "20px",
                    }}
                  ></i>
                  <div
                    className="aim-icon-item-name"
                    style={{ fontSize: "20px", paddingTop: "10px" }}
                  >
                    {activeGlyph}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="aim-modal--icon-preview-wrap flex-1">
            <div className="aim-modal--icon-search">
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter by name..."
              />
              <i className="fas fa-search"></i>
            </div>
            <div
              className="aim-modal--icon-preview-inner"
              ref={scrollContainerRef}
            >
              <div className="aim-modal--icon-preview">
                {glyphs.map((glyph) => (
                  <div
                    key={glyph}
                    className={`aim-icon-item ${activeGlyph === glyph ? "aesthetic-selected" : ""}`}
                    data-glyph={glyph}
                    onClick={() => setActiveGlyph(glyph)}
                  >
                    <div className="aim-icon-item-inner">
                      <i className={glyph}></i>
                      <div className="aim-icon-item-name">
                        {getGlyphName(glyph)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          className="aim-modal--footer"
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <button className="aim-insert-icon-button" onClick={handleInsert}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
