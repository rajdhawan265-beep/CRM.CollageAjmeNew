// ✅ Smart Attendance System (LocalStorage-only IN restriction with OUT block & auto history)

const allowedLat = 26.535527908072332;
const allowedLng = 74.53287275324718;
const radius = 0.05;

const studentMap = {
  "101": "Sunil Dhawan",
  "102": "Arjun Ram",
  "103": "Suheel",
  "104": "Rajesh",
  "105": "Jagdish kasaniyan",
  "106": "Mahender pg",
  "107": "Rajveer",
  "108": "Abhi",
  "109": "Manish",
  "110": "Manu",
  "469": "Mahendra Gahlot",
  "420": "Rahul Rawat",
  "506": "kana ram",
  "423": "Ramniwash",
  "Ajmer": "Yash"
};

const URL = "https://script.google.com/macros/s/AKfycbzhR-60-AUw2gL6_8ro7Dm3arl0exFNJ0a3n0MYPE-r-s4YwLrJDkJsT31mYk9LqqG92g/exec";
const historyUrl = "https://script.google.com/macros/s/AKfycbwYMb6IVNNSVO6E70ujDfO3x1x7G2sZX44X37MpTFiuBGysDNScXmsbZxuZUv-qJfXA/exec";
const statusMsg = document.getElementById("statusMsg");

let historyData = []; // ✅ Global fix

const today = new Date().toLocaleDateString("en-GB");
if (localStorage.getItem("lastActionDate") !== today) {
  localStorage.removeItem("attendanceStatus");
  localStorage.removeItem("firstInTime");
  localStorage.setItem("lastActionDate", today);
}

window.onload = () => {
  const savedId = localStorage.getItem("regId");
  if (savedId && studentMap[savedId]) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("attendanceSection").style.display = "block";
    checkLocation(savedId);
  }
};

function saveAndProceed() {
  const id = document.getElementById("regInput").value.trim();
  if (!id || !studentMap[id]) {
    alert("❌ Invalid ID!");
    return;
  }
  localStorage.setItem("regId", id);
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("attendanceSection").style.display = "block";
  checkLocation(id);
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function checkLocation(id) {
  const name = studentMap[id];
  const status = localStorage.getItem("attendanceStatus");

  if (status === "OUT") {
    statusMsg.innerHTML = `❌ <b>${name}</b>, आप पहले ही OUT हो चुके हैं!`;
    showHistory();
    return;
  }

  if (status === "IN") {
    statusMsg.innerHTML = `✅ Hello <b>${name}</b>, आप पहले ही IN हो चुके हैं!`;
    return;
  }

  statusMsg.innerHTML = "📡 Location check हो रही है...";
  navigator.geolocation.getCurrentPosition(pos => {
    const dist = getDistance(pos.coords.latitude, pos.coords.longitude, allowedLat, allowedLng);
    if (dist <= radius) {
      const now = new Date().toLocaleTimeString();
      localStorage.setItem("attendanceStatus", "IN");
      localStorage.setItem("firstInTime", now);
      statusMsg.innerHTML = `✅ IN दर्ज - समय: ${now}`;
      markAttendanceSilent("IN");
      setTimeout(showHistory, 2000);
    } else {
      statusMsg.innerHTML = `❌ आप लोकेशन से बाहर हैं!`;
    }
  });
}

function markAttendanceSilent(status) {
  const id = localStorage.getItem("regId");
  if (!id) return;
  const formData = new URLSearchParams({ ID: id, Status: status, Location: "auto" });
  fetch(URL, { method: "POST", body: formData });
}

function manualOut() {
  const id = localStorage.getItem("regId");
  if (!id) return;
  if (localStorage.getItem("attendanceStatus") !== "IN") {
    statusMsg.innerHTML = `⚠️ पहले IN करें!`;
    return;
  }
  localStorage.setItem("attendanceStatus", "OUT");
  markAttendanceSilent("OUT");
  statusMsg.innerHTML = `🔴 OUT दर्ज!`;
  setTimeout(showHistory, 1500);
}

function showHistory() {
  const id = localStorage.getItem("regId");
  fetch(`${historyUrl}?type=history&id=${id}`)
    .then(res => res.json())
    .then(data => {
      historyData = data;
      console.log("✅ History Loaded:", data);
    });
}
