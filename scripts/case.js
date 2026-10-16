function initImageStrips() {
  document.querySelectorAll(".case-image-strip, .case-table-scroll").forEach((strip) => {
    let isDragging = false;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let animationId = 0;

    function stopInertia() {
      cancelAnimationFrame(animationId);
      animationId = 0;
    }

    function startInertia() {
      let previousTime = performance.now();

      function animate(now) {
        const deltaTime = Math.min(now - previousTime, 32);
        previousTime = now;

        const previousScroll = strip.scrollLeft;

        strip.scrollLeft += velocity * deltaTime;

        // Постепенно уменьшаем скорость.
        velocity *= Math.pow(0.94, deltaTime / 16.67);

        const reachedEdge = Math.abs(strip.scrollLeft - previousScroll) < 0.1;

        if (Math.abs(velocity) < 0.02 || reachedEdge) {
          animationId = 0;
          return;
        }

        animationId = requestAnimationFrame(animate);
      }

      animationId = requestAnimationFrame(animate);
    }

    strip.addEventListener("dragstart", (event) => {
      // Вместо перетаскивания файла двигаем ленту.
      event.preventDefault();
    });

    strip.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;

      if (strip.scrollWidth <= strip.clientWidth) return;

      stopInertia();

      isDragging = true;
      lastX = event.clientX;
      lastTime = performance.now();
      velocity = 0;

      strip.classList.add("is-dragging");

      event.preventDefault();
    });

    window.addEventListener("mousemove", (event) => {
      if (!isDragging) return;

      const now = performance.now();
      const deltaTime = Math.max(now - lastTime, 1);
      const distance = event.clientX - lastX;

      const previousScroll = strip.scrollLeft;

      strip.scrollLeft -= distance;

      const currentVelocity = (strip.scrollLeft - previousScroll) / deltaTime;

      velocity = velocity * 0.3 + currentVelocity * 0.7;

      lastX = event.clientX;
      lastTime = now;

      event.preventDefault();
    });

    window.addEventListener("mouseup", () => {
      if (!isDragging) return;

      isDragging = false;
      strip.classList.remove("is-dragging");

      // Если перед отпусканием остановилась — инерции нет.
      if (performance.now() - lastTime > 80) {
        velocity = 0;
      }

      if (Math.abs(velocity) > 0.02) {
        startInertia();
      }
    });

    window.addEventListener("blur", () => {
      isDragging = false;
      velocity = 0;

      stopInertia();
      strip.classList.remove("is-dragging");
    });

    // Тачпад или колесо прерывают движение по инерции.
    strip.addEventListener("wheel", stopInertia, { passive: true });

    strip.addEventListener("touchstart", stopInertia, {
      passive: true,
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initImageStrips);
} else {
  initImageStrips();
}

const caseIntro = document.querySelector(".case-intro");
const caseBackground = document.querySelector(".case-background");

if (caseIntro && caseBackground) {
  const updateBackgroundHeight = () => {
    const introHeight = caseIntro.getBoundingClientRect().height;

    const headerHeight =
      document.querySelector(".case-header")?.getBoundingClientRect().height ?? 0;

    const offset = Number(
      caseBackground.dataset.backgroundOffset ?? 50
    );

    caseBackground.style.height =
      `${headerHeight + introHeight + offset}px`;
  };

  updateBackgroundHeight();

  const introObserver = new ResizeObserver(updateBackgroundHeight);

  introObserver.observe(caseIntro, {
    box: "border-box",
  });
}

{
  const previewFrame = document.querySelector(".case-preview-frame");

  const dedImages = document.querySelectorAll(
    ".case-image-strip .strip-img.ded"
  );

  if (previewFrame && dedImages.length) {
    const syncDedHeight = () => {
      const height = previewFrame.getBoundingClientRect().height;

      dedImages.forEach((image) => {
        image.style.setProperty("--ded-height", `${height}px`);
      });
    };

    syncDedHeight();

    const previewFrameObserver = new ResizeObserver(syncDedHeight);

    previewFrameObserver.observe(previewFrame, {
      box: "border-box",
    });
  }
}