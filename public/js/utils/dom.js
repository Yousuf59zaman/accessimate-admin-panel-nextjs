module.exports = {
    createElement(tag, attrs = {}, styles = {}, children = []) {
        const element = document.createElement(tag);

        Object.entries(attrs).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return;
            }

            if (key === "style" && typeof value === "object") {
                Object.assign(element.style, value);
                return;
            }

            element.setAttribute(key, value);
        });

        Object.assign(element.style, styles);

        children.forEach((child) => {
            if (child && typeof child === "object" && child.nodeType) {
                element.appendChild(child);
            } else if (typeof child === "string") {
                element.appendChild(document.createTextNode(child));
            }
        });

        return element;
    },

    createAccessibilityControl({ icon, label, isActive = false, onClick }) {
        const control = this.createElement(
            "button",
            {
                type: "button",
                "aria-pressed": String(!!isActive),
            },
            {
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                backgroundColor: isActive ? "#eef2ff" : "#ffffff",
                color: "#111827",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 2px 6px rgba(79,70,229,0.2)" : "0 1px 2px rgba(0,0,0,0.05)",
                textAlign: "left",
            }
        );

        const iconEl = this.createElement("i", { class: icon }, { fontSize: "16px", color: isActive ? "#4338ca" : "#4b5563" });
        const labelEl = this.createElement(
            "span",
            {},
            {
                fontSize: "12px",
                fontWeight: 600,
            },
            [label || ""]
        );

        control.appendChild(iconEl);
        control.appendChild(labelEl);

        control.addEventListener("mouseenter", () => {
            control.style.borderColor = "#c7d2fe";
            control.style.boxShadow = "0 2px 8px rgba(79,70,229,0.18)";
        });

        control.addEventListener("mouseleave", () => {
            control.style.borderColor = "#e5e7eb";
            control.style.boxShadow = isActive ? "0 2px 6px rgba(79,70,229,0.2)" : "0 1px 2px rgba(0,0,0,0.05)";
        });

        control.addEventListener("click", (e) => {
            e.preventDefault();
            if (typeof onClick === "function") {
                onClick(e);
            }
        });

        return control;
    },
};
