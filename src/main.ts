// src/main.ts
import { TourWidget } from "./tourWidget";
import type { Tour } from "./types";

declare global {
  interface Window {
    initTourWidget: (
      tourId: string,
      options?: {
        apiBaseUrl?: string;
        theme?: {
          primaryColor?: string;
          textColor?: string;
          backgroundColor?: string;
          cardTitleColor?: string;
          cardDescriptionColor?: string;
        };
      }
    ) => Promise<void>;
  }
}

const mockTour: Tour = {
  id: "tour_demo_123",
  name: "Welcome Tour",
  steps: [
    {
      id: "step_1",
      title: "👋 Welcome to Our App!",
      description:
        "We're excited to have you here! This quick tour will show you around and help you get started in just 2 minutes.",
      order: 1,
    },
    {
      id: "step_2",
      title: "📊 Your Dashboard",
      description:
        "This is your central hub where you can see all your projects, tasks, and team activity at a glance. Everything you need is just one click away.",
      order: 2,
    },
    {
      id: "step_3",
      title: "➕ Create New Projects",
      description:
        'Click the "New Project" button anytime to start organizing your work. You can add team members, set deadlines, and track progress easily.',
      order: 3,
    },
    {
      id: "step_4",
      title: "⚙️ Customize Your Settings",
      description:
        "Head to settings to personalize your experience. Manage notifications, connect integrations, and adjust your preferences to work your way.",
      order: 4,
    },
    {
      id: "step_5",
      title: "🎉 You're All Set!",
      description:
        "That's it! You're ready to start using the app. Need help? Check out our documentation or contact our support team anytime.",
      order: 5,
    },
  ],
};

window.initTourWidget = async function (tourId: string, options = {}) {
  try {
    let tour: Tour;
    const { apiBaseUrl = "", theme = {} } = options;

    if (apiBaseUrl) {
      const response = await fetch(`${apiBaseUrl}/api/tours/${tourId}`);
      if (response.ok) {
        tour = await response.json();
      } else {
        console.warn("Failed to fetch tour from API, using mock data");
        tour = mockTour;
      }
    } else {
      console.log("No API URL provided, using mock tour data");
      tour = mockTour;
    }

    new TourWidget(tour, apiBaseUrl, theme);
  } catch (error) {
    console.error("Failed to initialize tour:", error);
    new TourWidget(mockTour, options.apiBaseUrl, options.theme);
  }
};
document.addEventListener("DOMContentLoaded", () => {
  const script = document.querySelector("script[data-tour-id]");
  if (script) {
    const tourId = script.getAttribute("data-tour-id");
    const apiUrl = script.getAttribute("data-api-url") || "";
    const themeColor = script.getAttribute("data-theme-color") || "#8b5cf6";
    const textColor = script.getAttribute("data-text-color") || "#ffffff";
    const bgColor = script.getAttribute("data-bg-color") || "#ffffff";
    const titleColor = script.getAttribute("data-title-color") || "#111827";
    const descColor =
      script.getAttribute("data-description-color") || "#6b7280";

    if (tourId) {
      window.initTourWidget(tourId, {
        apiBaseUrl: apiUrl,
        theme: {
          primaryColor: themeColor,
          textColor: textColor,
          backgroundColor: bgColor,
          cardTitleColor: titleColor,
          cardDescriptionColor: descColor,
        },
      });
    }
  }
});

if (import.meta.env.DEV) {
  setTimeout(() => {
    window.initTourWidget("tour_demo_123", {
      theme: {
        primaryColor: "#8b5cf6",
        textColor: "#ffffff",
      },
    });
  }, 1000);

  // Dev reset button
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "🔄 Reset Tour";
  resetBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    z-index: 999998;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;

  resetBtn.addEventListener("click", () => {
    localStorage.clear();
    location.reload();
  });

  document.body.appendChild(resetBtn);
}
