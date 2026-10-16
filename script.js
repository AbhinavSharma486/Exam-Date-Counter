const STORAGE_KEY = "examCountdownSettings.v1";

const elements = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  examDateDisplay: document.getElementById("examDateDisplay"),
  todayDisplay: document.getElementById("todayDisplay"),
  modal: document.getElementById("settingsModal"),
  form: document.getElementById("examForm"),
  name: document.getElementById("examName"),
  date: document.getElementById("examDate"),
  time: document.getElementById("examTime"),
  error: document.getElementById("formError"),
  toast: document.getElementById("toast"),
};

let settings = loadSettings();
let toastTimer;
let previousValues = {};

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Could not load saved countdown settings.", error);
    return null;
  }
}

function saveSettings(value) {
  settings = value;
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    showToast("Could not save settings in this browser.");
  }
}

function pad(number) {
  return String(number).padStart(2, "0");
}

function getTargetDate() {
  if (!settings?.date || !settings?.time) return null;
  const target = new Date(`${settings.date}T${settings.time}:00`);
  return Number.isNaN(target.getTime()) ? null : target;
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short", day: "numeric", month: "long", year: "numeric"
  }).format(date);
}

function animateValue(element, value, key) {
  if (previousValues[key] !== value) {
    element.textContent = value;
    element.classList.remove("tick");
    // Trigger a lightweight number-change animation.
    void element.offsetWidth;
    element.classList.add("tick");
    previousValues[key] = value;
  }
}

function renderClock() {
  const now = new Date();
  elements.todayDisplay.textContent = `TODAY · ${new Intl.DateTimeFormat(undefined, {
    weekday: "short", day: "2-digit", month: "short", year: "numeric"
  }).format(now).toUpperCase()}`;

  const target = getTargetDate();
  if (!target) {
    ["days", "hours", "minutes", "seconds"].forEach((key) => {
      animateValue(elements[key], "--", key);
    });
    elements.examDateDisplay.textContent = "Set your exam date";
    return;
  }

  elements.examDateDisplay.textContent = settings.name
    ? `${settings.name} · ${formatDate(target)}`
    : formatDate(target);

  const remaining = target.getTime() - now.getTime();
  if (remaining <= 0) {
    ["days", "hours", "minutes", "seconds"].forEach((key) => {
      animateValue(elements[key], "00", key);
    });
    elements.examDateDisplay.textContent = settings.name
      ? `${settings.name} · Exam time`
      : `${formatDate(target)} · Exam time`;
    document.querySelector(".subtitle").textContent = "Your countdown has reached zero.";
    document.querySelector("h1").innerHTML = 'It’s <span>time.</span>';
    document.querySelector(".eyebrow").innerHTML = '<span class="eyebrow-line"></span> EXAM TIME';
    return;
  }

  document.querySelector(".subtitle").textContent = "One date. One goal. Keep your eyes on the time left.";
  document.querySelector("h1").innerHTML = 'Every second<br> <span>counts.</span>';
  document.querySelector(".eyebrow").innerHTML = '<span class="eyebrow-line"></span> YOUR MOMENT IS GETTING CLOSER';

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  animateValue(elements.days, String(days), "days");
  animateValue(elements.hours, pad(hours), "hours");
  animateValue(elements.minutes, pad(minutes), "minutes");
  animateValue(elements.seconds, pad(seconds), "seconds");
}

function openModal() {
  elements.modal.classList.add("open");
  elements.modal.setAttribute("aria-hidden", "false");
  elements.error.textContent = "";
  elements.date.min = new Date().toLocaleDateString("en-CA");
  if (settings) {
    elements.name.value = settings.name || "";
    elements.date.value = settings.date || "";
    elements.time.value = settings.time || "09:00";
  } else {
    elements.name.value = "";
    elements.date.value = "";
    elements.time.value = "09:00";
  }
  setTimeout(() => elements.date.focus(), 80);
}

function closeModal() {
  elements.modal.classList.remove("open");
  elements.modal.setAttribute("aria-hidden", "true");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

document.getElementById("settingsToggle").addEventListener("click", openModal);
document.getElementById("editDateButton").addEventListener("click", openModal);
document.getElementById("closeModal").addEventListener("click", closeModal);

elements.modal.addEventListener("click", (event) => {
  if (event.target === elements.modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.modal.classList.contains("open")) closeModal();
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  elements.error.textContent = "";
  const date = elements.date.value;
  const time = elements.time.value;
  const name = elements.name.value.trim();

  if (!date || !time) {
    elements.error.textContent = "Please choose an exam date and start time.";
    return;
  }
  const target = new Date(`${date}T${time}:00`);
  if (Number.isNaN(target.getTime())) {
    elements.error.textContent = "That date or time doesn't look valid.";
    return;
  }
  if (target.getTime() <= Date.now()) {
    elements.error.textContent = "Choose a future date and time.";
    return;
  }

  saveSettings({ name, date, time });
  previousValues = {};
  renderClock();
  closeModal();
  showToast("Your exam countdown is saved.");
});

document.getElementById("clearSettings").addEventListener("click", () => {
  saveSettings(null);
  previousValues = {};
  elements.form.reset();
  elements.time.value = "09:00";
  renderClock();
  closeModal();
  showToast("Saved exam date cleared.");
});

renderClock();
if (!settings) openModal();
setInterval(renderClock, 1000);
