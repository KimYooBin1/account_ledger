// Tutorial Manager - 공통 튜토리얼 로직
class TutorialManager {
  constructor(steps) {
    this.steps = steps; // [{ target: selector, message: string, position: 'top'|'bottom'|'left'|'right' }]
    this.currentStep = 0;
    this.overlay = null;
    this.tooltip = null;
    this.isActive = false;
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.currentStep = 0;
    this.showStep();
  }

  showStep() {
    if (this.currentStep >= this.steps.length) {
      this.end();
      return;
    }

    const step = this.steps[this.currentStep];
    const targetElement = document.querySelector(step.target);

    if (!targetElement) {
      console.warn(`Tutorial target not found: ${step.target}`);
      this.next();
      return;
    }

    // Create overlay
    this.createOverlay();

    // Highlight target
    this.highlightElement(targetElement);

    // Show tooltip
    this.showTooltip(targetElement, step);

    // Scroll to element
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  createOverlay() {
    if (this.overlay) {
      this.overlay.remove();
    }

    this.overlay = document.createElement("div");
    this.overlay.className = "tutorial-overlay";
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) {
        this.next();
      }
    };
    document.body.appendChild(this.overlay);
  }

  highlightElement(element) {
    // Remove previous highlight
    document.querySelectorAll(".tutorial-highlight").forEach((el) => {
      el.classList.remove("tutorial-highlight");
    });

    // Add highlight
    element.classList.add("tutorial-highlight");
  }

  showTooltip(targetElement, step) {
    if (this.tooltip) {
      this.tooltip.remove();
    }

    this.tooltip = document.createElement("div");
    this.tooltip.className = "tutorial-tooltip";
    this.tooltip.innerHTML = `
      <div class="mb-3">
        <h3 class="text-lg font-bold text-gray-800 mb-2">${
          step.title || "안내"
        }</h3>
        <p class="text-sm text-gray-600">${step.message}</p>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-500">${this.currentStep + 1} / ${
      this.steps.length
    }</span>
        <div class="flex gap-2">
          ${
            this.currentStep > 0
              ? '<button class="tutorial-prev px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">이전</button>'
              : ""
          }
          ${
            this.currentStep < this.steps.length - 1
              ? '<button class="tutorial-next px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">다음</button>'
              : '<button class="tutorial-finish px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">완료</button>'
          }
          <button class="tutorial-skip px-3 py-1 text-sm text-gray-500 hover:text-gray-700">건너뛰기</button>
        </div>
      </div>
    `;

    // Add arrow
    const arrow = document.createElement("div");
    arrow.className = `tutorial-arrow ${step.position || "top"}`;
    this.tooltip.appendChild(arrow);

    document.body.appendChild(this.tooltip);

    // Position tooltip
    this.positionTooltip(targetElement, step.position || "top");

    // Add event listeners
    const nextBtn = this.tooltip.querySelector(".tutorial-next");
    const prevBtn = this.tooltip.querySelector(".tutorial-prev");
    const finishBtn = this.tooltip.querySelector(".tutorial-finish");
    const skipBtn = this.tooltip.querySelector(".tutorial-skip");

    if (nextBtn) nextBtn.onclick = () => this.next();
    if (prevBtn) prevBtn.onclick = () => this.prev();
    if (finishBtn) finishBtn.onclick = () => this.end();
    if (skipBtn) skipBtn.onclick = () => this.end();
  }

  positionTooltip(targetElement, position) {
    const rect = targetElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const margin = 20;

    let top, left;

    switch (position) {
      case "bottom":
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - margin;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + margin;
        break;
      case "top":
      default:
        top = rect.top - tooltipRect.height - margin;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
    }

    // Keep tooltip within viewport
    const padding = 10;
    if (left < padding) left = padding;
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding;
    }

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }

  next() {
    this.currentStep++;
    this.showStep();
  }

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep();
    }
  }

  end() {
    this.isActive = false;

    // Clean up
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }

    document.querySelectorAll(".tutorial-highlight").forEach((el) => {
      el.classList.remove("tutorial-highlight");
    });

    // Mark tutorial as completed
    this.markCompleted();

    // Call onComplete callback if exists
    if (this.onComplete && typeof this.onComplete === "function") {
      this.onComplete();
    }
  }

  async markCompleted() {
    // To be implemented by subclass
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = TutorialManager;
}
