const CONFIG = {
  side: 257,
  gap: 12,
  baseWidth: 1232,
  baseHeight: 784,
  center: { min: 320, max: 460 },
  height: { min: 772, max: 1050 },
  skills: { min: 188, max: 230 },
  closed: { min: 188, max: 230 },
  leisure: { min: 260, max: 390 },
  work: { min: 384, max: 540 },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function resize() {
  const el = document.getElementById("layout"),
    debug = document.getElementById("debug");
  const vw = document.documentElement.clientWidth;
  if (vw < 960) {
    el.removeAttribute("style");
    debug.textContent = `${vw} × ${innerHeight} | ${vw < 550 ? "mobile" : "tablet"} | scale OFF | max width 800 | D: скрыть`;
    return;
  }
  const W = Math.max(1, vw - 48),
    H = Math.max(1, innerHeight - 48),
    c = CONFIG;
  const minW = 2 * c.side + 3 * c.gap + 2 * c.center.min,
    maxW = 2 * c.side + 3 * c.gap + 2 * c.center.max;
  const lower = Math.max(W / maxW, H / c.height.max),
    upper = Math.min(W / minW, H / c.height.min),
    feasible = lower <= upper;
  const desired = Math.sqrt((W / c.baseWidth) * (H / c.baseHeight)),
    s = feasible ? clamp(desired, lower, upper) : Math.min(W / minW, H / c.height.min);
  const lw = feasible ? W / s : clamp(W / s, minW, maxW),
    lh = feasible ? H / s : clamp(H / s, c.height.min, c.height.max),
    center = (lw - 2 * c.side - 3 * c.gap) / 2;
  const skills = clamp((188 * lh) / 784, c.skills.min, c.skills.max),
    closed = clamp((180 * lh) / 784, c.closed.min, c.closed.max),
    leisure = clamp((304.121 * lh) / 784, c.leisure.min, c.leisure.max),
    work = clamp((384 * lh) / 784, c.work.min, c.work.max);
  el.style.width = lw + "px";
  el.style.height = lh + "px";
  el.style.transform = `scale(${s})`;
  el.style.left = (W - lw * s) / 2 + "px";
  el.style.top = (H - lh * s) / 2 + "px";
  Object.entries({
    "--center": center,
    "--about": lh - c.gap - skills,
    "--closed": closed,
    "--leisure": leisure,
    "--work": work,
  }).forEach(([k, v]) => el.style.setProperty(k, v + "px"));
  debug.textContent = `${vw} × ${innerHeight} | desktop | scale ${s.toFixed(3)} | center ${center.toFixed(1)} | ${feasible ? "fill" : "contain: пределы адаптации"} | D: скрыть`;
}
addEventListener("resize", resize);
resize();
addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "d" && !e.ctrlKey && !e.metaKey)
    document.body.classList.toggle("debug");
});
document.querySelectorAll("[data-demo]").forEach((b) =>
  b.addEventListener("click", () => {
    document.getElementById("dialogTitle").textContent = b.dataset.demo;
    document.querySelector("dialog").showModal();
  }),
);

const orangeCard = document.querySelector(".card.orange");

// Пропорции прежнего изображения телефона: 408 × 832.
// Если у модалка.png другой размер холста, это значение нужно уточнить.
const PHONE_RATIO = 408 / 832;

function updatePhoneGeometry() {
  if (!orangeCard) return;

  // Размер карточки ДО общего десктопного скейла.
  const cardWidth = orangeCard.clientWidth;
  const cardHeight = orangeCard.clientHeight;

  const viewportWidth = document.documentElement.clientWidth;
  const isTablet = viewportWidth >= 550 && viewportWidth < 960;

  let areaLeft;
  let areaTop;
  let areaWidth;
  let areaHeight;

  if (isTablet) {
    // Прежний планшетный контейнер:
    // телефон слева, описание справа.
    areaLeft = 16;
    areaTop = 16;
    areaWidth = (cardWidth - 48) / 2;
    areaHeight = 340;
  } else {
    // Прежний .orange .visual:
    // top: 131px; bottom: 4px; left/right: 16px.
    areaLeft = 16;
    areaTop = 131;
    areaWidth = cardWidth - 32;
    areaHeight = cardHeight - 135;
  }

  // Вписываем телефон, сохраняя его пропорции.
  const phoneHeight = Math.max(0, Math.min(areaHeight, areaWidth / PHONE_RATIO));

  const phoneWidth = phoneHeight * PHONE_RATIO;

  // Центрируем по горизонтали, прижимаем к низу области.
  const phoneLeft = areaLeft + (areaWidth - phoneWidth) / 2;
  const phoneTop = areaTop + areaHeight - phoneHeight;

  orangeCard.style.setProperty("--phone-left", `${phoneLeft}px`);
  orangeCard.style.setProperty("--phone-top", `${phoneTop}px`);
  orangeCard.style.setProperty("--phone-width", `${phoneWidth}px`);
  orangeCard.style.setProperty("--phone-height", `${phoneHeight}px`);
}

const phoneResizeObserver = new ResizeObserver(updatePhoneGeometry);

if (orangeCard) {
  phoneResizeObserver.observe(orangeCard);
}

window.addEventListener("resize", updatePhoneGeometry);

updatePhoneGeometry();

document.querySelectorAll(".orange-scene").forEach((scene) => {
  const video = scene.querySelector("video.background-mandarin");

  const modal = scene.querySelector(
    "img.visual-phone--modal"
  );

  if (!video || !modal) return;

  const animation = modal.getAnimations().find(
    (item) => item.animationName === "phone-modal-reveal"
  );

  if (!animation) return;

  const syncAnimation = (seconds) => {
    animation.currentTime = seconds * 1000;
  };

  syncAnimation(video.currentTime);

  if (typeof video.requestVideoFrameCallback === "function") {
    const onVideoFrame = (now, metadata) => {
      syncAnimation(metadata.mediaTime);
      video.requestVideoFrameCallback(onVideoFrame);
    };

    video.requestVideoFrameCallback(onVideoFrame);
  } else {
    let frameId = null;

    const update = () => {
      syncAnimation(video.currentTime);

      if (!video.paused && !video.ended) {
        frameId = requestAnimationFrame(update);
      } else {
        frameId = null;
      }
    };

    const startUpdates = () => {
      if (frameId !== null) return;
      update();
    };

    const stopUpdates = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }

      syncAnimation(video.currentTime);
    };

    video.addEventListener("playing", startUpdates);
    video.addEventListener("pause", stopUpdates);
    video.addEventListener("ended", stopUpdates);

    video.addEventListener("timeupdate", () => {
      syncAnimation(video.currentTime);
    });

    video.addEventListener("seeked", () => {
      syncAnimation(video.currentTime);
    });

    if (!video.paused && !video.ended) {
      startUpdates();
    }
  }
});