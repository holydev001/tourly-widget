// src/TourWidget.ts
// src/TourWidget.ts
import type { Tour, AnalyticsEvent } from "./types";

interface WidgetTheme {
  primaryColor?: string;
  textColor?: string;
  backgroundColor?: string;
  cardTitleColor?: string;
  cardDescriptionColor?: string;
}

export class TourWidget {
  private tour: Tour;
  private currentStepIndex: number = 0;
  private container: HTMLElement | null = null;
  private sessionId: string;
  private apiBaseUrl: string;
  private theme: WidgetTheme;

  constructor(tour: Tour, apiBaseUrl: string = "", theme: WidgetTheme = {}) {
    this.tour = tour;
    this.apiBaseUrl = apiBaseUrl;
    this.theme = {
      primaryColor: theme.primaryColor || "#8b5cf6",
      textColor: theme.textColor || "#ffffff",
      backgroundColor: theme.backgroundColor || "#ffffff",
      cardTitleColor: theme.cardTitleColor || "#111827",
      cardDescriptionColor: theme.cardDescriptionColor || "#6b7280",
    };
    this.sessionId = this.generateSessionId();
    this.currentStepIndex = this.loadProgress();
    this.init();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private init() {
    if (this.isTourCompleted()) {
      console.log("Tour already completed, not showing again");
      return;
    }

    this.injectStyles();
    this.createUI();
    this.showCurrentStep();
    this.trackEvent("tour_started");
  }

  private injectStyles() {
    // Check if styles already injected
    if (document.getElementById("tour-widget-styles")) return;

    const style = document.createElement("style");
    style.id = "tour-widget-styles";
    style.textContent = `
      .tour-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
        animation: tourFadeIn 0.3s ease-out;
      }

      @keyframes tourFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .tour-card {
  background: ${this.theme.backgroundColor};
  padding: 32px;
  border-radius: 16px;
  max-width: 540px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: tourSlideUp 0.3s ease-out;
  position: relative;
}
      @keyframes tourSlideUp {
        from {
          transform: translateY(30px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .tour-progress-text {
        text-align: center;
        font-size: 14px;
        color: #666;
        margin-bottom: 12px;
        font-weight: 500;
      }

      .tour-progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: 24px;
      }

      .tour-progress-fill {
        height: 100%;
        background: ${this.theme.primaryColor};
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 999px;
      }

  .tour-title {
  font-size: 28px;
  font-weight: 700;
  color: ${this.theme.cardTitleColor};
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.tour-description {
  font-size: 16px;
  color: ${this.theme.cardDescriptionColor};
  line-height: 1.6;
  margin: 0 0 28px 0;
}
      .tour-buttons {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .tour-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      }

      .tour-btn-back {
        background: #f3f4f6;
        color: #374151;
      }

      .tour-btn-back:hover:not(:disabled) {
        background: #e5e7eb;
        transform: translateY(-1px);
      }

      .tour-btn-back:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .tour-btn-skip {
        background: transparent;
        color: #9ca3af;
        text-decoration: underline;
        padding: 12px 16px;
        font-weight: 500;
      }

      .tour-btn-skip:hover {
        color: #6b7280;
      }

      .tour-btn-next {
        background: ${this.theme.primaryColor};
        color: ${this.theme.textColor};
        flex: 1;
        box-shadow: 0 4px 12px ${this.theme.primaryColor}33;
      }

      .tour-btn-next:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px ${this.theme.primaryColor}44;
      }

      .tour-btn-next:active {
        transform: translateY(0);
      }

      @media (max-width: 640px) {
        .tour-card {
          padding: 24px;
          width: 95%;
        }

        .tour-title {
          font-size: 24px;
        }

        .tour-description {
          font-size: 15px;
        }

        .tour-buttons {
          flex-wrap: wrap;
        }

        .tour-btn {
          padding: 10px 20px;
          font-size: 14px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private createUI() {
    this.container = document.createElement("div");
    this.container.id = "tour-widget-overlay";
    this.container.className = "tour-overlay";

    this.container.innerHTML = `
      <div class="tour-card">
        <div class="tour-progress-text">Step 1 of ${this.tour.steps.length}</div>
        <div class="tour-progress-bar">
          <div class="tour-progress-fill"></div>
        </div>
        <h2 class="tour-title"></h2>
        <p class="tour-description"></p>
        <div class="tour-buttons">
          <button class="tour-btn tour-btn-back" id="tour-back">← Back</button>
          <button class="tour-btn tour-btn-skip" id="tour-skip">Skip Tour</button>
          <button class="tour-btn tour-btn-next" id="tour-next">Next →</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.container
      .querySelector("#tour-next")
      ?.addEventListener("click", () => this.nextStep());
    this.container
      .querySelector("#tour-back")
      ?.addEventListener("click", () => this.previousStep());
    this.container
      .querySelector("#tour-skip")
      ?.addEventListener("click", () => this.skipTour());
  }

  private showCurrentStep() {
    if (!this.container) return;

    const step = this.tour.steps[this.currentStepIndex];
    const totalSteps = this.tour.steps.length;
    const progressPercent = ((this.currentStepIndex + 1) / totalSteps) * 100;

    const title = this.container.querySelector(".tour-title");
    const description = this.container.querySelector(".tour-description");
    const progressText = this.container.querySelector(".tour-progress-text");
    const progressFill = this.container.querySelector(
      ".tour-progress-fill"
    ) as HTMLElement;
    const backBtn = this.container.querySelector(
      "#tour-back"
    ) as HTMLButtonElement;
    const nextBtn = this.container.querySelector(
      "#tour-next"
    ) as HTMLButtonElement;

    if (title) title.textContent = step.title;
    if (description) description.textContent = step.description;
    if (progressText)
      progressText.textContent = `Step ${
        this.currentStepIndex + 1
      } of ${totalSteps}`;
    if (progressFill) progressFill.style.width = `${progressPercent}%`;

    if (backBtn) backBtn.disabled = this.currentStepIndex === 0;
    if (nextBtn) {
      nextBtn.textContent =
        this.currentStepIndex === totalSteps - 1 ? "✓ Finish" : "Next →";
    }

    this.trackEvent("step_viewed", { stepId: step.id });
  }

  private nextStep() {
    const currentStep = this.tour.steps[this.currentStepIndex];
    this.trackEvent("step_completed", { stepId: currentStep.id });

    if (this.currentStepIndex < this.tour.steps.length - 1) {
      this.currentStepIndex++;
      this.saveProgress();
      this.showCurrentStep();
    } else {
      this.completeTour();
    }
  }

  private previousStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.saveProgress();
      this.showCurrentStep();
    }
  }

  private skipTour() {
    const currentStep = this.tour.steps[this.currentStepIndex];
    this.trackEvent("tour_skipped", {
      stepId: currentStep.id,
    });
    this.clearProgress();
    this.destroy();
  }

  private completeTour() {
    this.trackEvent("tour_completed");
    this.markTourCompleted();
    this.clearProgress();

    if (this.container) {
      const card = this.container.querySelector(".tour-card");
      if (card) {
        card.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <h2 class="tour-title">Tour Complete!</h2>
            <p class="tour-description">You're all set to get started.</p>
            <button class="tour-btn tour-btn-next" id="tour-close" style="width: 100%; margin-top: 20px;">
              Got it!
            </button>
          </div>
        `;

        this.container
          .querySelector("#tour-close")
          ?.addEventListener("click", () => {
            this.destroy();
          });
      }
    }

    setTimeout(() => {
      this.destroy();
    }, 3000);
  }

  private destroy() {
    if (this.container) {
      this.container.style.opacity = "0";
      setTimeout(() => {
        this.container?.remove();
        this.container = null;
      }, 300);
    }
  }

  private loadProgress(): number {
    try {
      const saved = localStorage.getItem(`tour_${this.tour.id}_progress`);
      return saved ? parseInt(saved) : 0;
    } catch {
      return 0;
    }
  }

  private saveProgress() {
    try {
      localStorage.setItem(
        `tour_${this.tour.id}_progress`,
        String(this.currentStepIndex)
      );
    } catch (e) {
      console.warn("Failed to save tour progress:", e);
    }
  }

  private clearProgress() {
    try {
      localStorage.removeItem(`tour_${this.tour.id}_progress`);
    } catch (e) {
      console.warn("Failed to clear tour progress:", e);
    }
  }

  private isTourCompleted(): boolean {
    try {
      return localStorage.getItem(`tour_${this.tour.id}_completed`) === "true";
    } catch {
      return false;
    }
  }

  private markTourCompleted() {
    try {
      localStorage.setItem(`tour_${this.tour.id}_completed`, "true");
    } catch (e) {
      console.warn("Failed to mark tour as completed:", e);
    }
  }

  private trackEvent(
    eventType: AnalyticsEvent["eventType"],
    data: Partial<AnalyticsEvent> = {}
  ) {
    const event: AnalyticsEvent = {
      tourId: this.tour.id,
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      ...data,
    };

    console.log("📊 Analytics Event:", event);

    if (this.apiBaseUrl) {
      fetch(`${this.apiBaseUrl}/api/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch((err) => console.warn("Analytics error:", err));
    }
  }
}
