 AOS.init({
        duration: 800,
        once: true,
    });

    let historyData = []; // Global variable to store fetched history

    const allowedLat =  26.8914853502423;   
    const allowedLng = 75.79150306635118; 
    const radius = 0.50; // 0.05 km = 50 meters

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

    // IMPORTANT: Check and update these Google Script URLs
    const URL = "https://script.google.com/macros/s/AKfycbzhR-60-AUw2gL6_8ro7Dm3arl0exFN0a3n0MYPE-r-s4YwLrJDkJsT31mYk9LqqG92g/exec";
    const historyUrl = "https://script.google.com/macros/s/AKfycbwYMb6IVNNSVO6E70ujDfO3x1x7G2sZX44X37MpTFiuBGysDNScXmsbZxuZUv-qJfXA/exec";
    const statusMsg = document.getElementById("statusMsg");

    // 🔁 Reset logic if day changed
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

        // Hide login elements after successful login
      document.getElementById("regInput").style.display = "none";
      const loginBtn = document.querySelector('button[onclick="saveAndProceed()"]');
      if (loginBtn) loginBtn.style.display = "none";

      const createWrapper = document.getElementById("createAccountWrapper");
      if (createWrapper) createWrapper.style.display = "none";

      document.getElementById("loginSection").style.display = "none";
      document.getElementById("attendanceSection").style.display = "block";

      checkLocation(id);
    }

    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    function checkLocation(id) {
      const name = studentMap[id];
      const today = new Date().toLocaleDateString("en-GB");
      const status = localStorage.getItem("attendanceStatus");
      const lastDate = localStorage.getItem("lastActionDate");

      if (lastDate === today && status === "OUT") {
        statusMsg.innerHTML = `❌ <b >${name}</b>, आप पहले ही 🟢'IN' और 🔴'OUT' हो चुके हैं! दोबारा अनुमत नहीं है।`;
        showHistory();
        return;
      }

      if (lastDate === today && status === "IN") {
        const time = localStorage.getItem("firstInTime");
        statusMsg.innerHTML = `✅ Hello <b >${name}</b>, आप पहले ही "🟢IN" हो चुके हैं<br>⏰ समय: ${time}`;
        return;
      }

      statusMsg.innerHTML = `<span class="spinner"></span> 📡 Location check हो रही है...`;
      if (!navigator.geolocation) {
        statusMsg.innerHTML = "❌ Location supported नहीं है।";
        return;
      }

      navigator.geolocation.getCurrentPosition(pos => {
        const dist = getDistance(pos.coords.latitude, pos.coords.longitude, allowedLat, allowedLng);

        if (dist <= radius) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString();

          localStorage.setItem("attendanceStatus", "IN");
          localStorage.setItem("lastActionDate", today);
          localStorage.setItem("firstInTime", timeStr);

          statusMsg.innerHTML = `✅ Hello <b >${name}</b>, आप Institute क्षेत्र के अंदर हैं!<br>✅ आपकी "🟢IN" उपस्थिति दर्ज की गई है - समय: ⏰${timeStr}`;
          markAttendanceSilent("IN");
          setTimeout(showHistory, 2000);
        } else {
          statusMsg.innerHTML = `❌ आप Institute क्षेत्र से बाहर हैं <b style="color: var(--danger-color)">(🧍‍♂️📏 ${dist.toFixed(2)} km)</b> आपकी IN उपस्थिति नहीं हो सकती।`;
        }

      }, err => {
        statusMsg.innerHTML = `❌ Location error: ${err.message}`;
      });
    }

    function markAttendanceSilent(status) {
      const id = localStorage.getItem("regId");
      if (!id) return;
      const formData = new URLSearchParams({ ID: id, Status: status, Location: "auto" });
      fetch(URL, { method: "POST", body: formData })
        .then(res => console.log("✔ Attendance submitted"))
        .catch(err => console.error("❌ fetch error:", err));
    }

    function manualOut() {
      const id = localStorage.getItem("regId");
      if (!id) return;

      const name = studentMap[id];
      const attendanceStatus = localStorage.getItem("attendanceStatus");

      if (attendanceStatus !== "IN") {
        statusMsg.innerHTML = `⚠️ <b>${name}</b>, आपकी \"IN\" उपस्थिति नहीं मिली है। पहले IN करें फिर OUT करें।`;
        return;
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      localStorage.setItem("attendanceStatus", "OUT");

      statusMsg.innerHTML = `🔴 आप Manual रूप से \"OUT\" हो गए हैं!<br>\"OUT\" उपस्थिति दर्ज की गई है - ⏰${timeStr}`;
      markAttendanceSilent("OUT");
      setTimeout(showHistory, 1500);
    }

    function showHistory() {
      const id = localStorage.getItem("regId");
      if (!id) return;

      const hb = document.getElementById("historyTableBody");
      const loaderDiv = document.getElementById("loaderMsg");

      loaderDiv.innerHTML = `<span class="spinner"></span> कृपया प्रतीक्षा करें...`;
      hb.innerHTML = `<tr><td colspan="4" style="text-align:center;"><span class="spinner"></span> कृपया प्रतीक्षा करें...</td></tr>`;
      document.getElementById("historyModal").style.display = "flex";

      fetch(`${historyUrl}?type=history&id=${id}`)
        .then(res => res.json())
        .then(data => {
          historyData = data;
          loaderDiv.innerHTML = "";
          renderHistoryTable(historyData);
        })
        .catch(() => {
          loaderDiv.innerHTML = "❌ History लोड करने में त्रुटि हुई!";
          hb.innerHTML = "<tr><td colspan='4'>❌ History लोड करने में विफल!</td></tr>";
        });
    }

    // This function is generally not necessary unless you need retrying logic
    // function retryHistoryFetch(retry, status) { ... }

    function convertToInputFormat(dateStr) {
      // Assuming dateStr is in DD/MM/YYYY format based on your script logic
      const parts = dateStr.split("/");
      if (parts.length !== 3) return "";
      const [dd, mm, yyyy] = parts;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }

    function changeToDate(input) {
      input.type = 'date';
      input.click();
    }

    function restoreTextType(input) {
      if (input.value === '') {
        input.type = 'text';
      }
    }

    function renderHistoryTable(data) {
        const hb = document.getElementById("historyTableBody");
        const selectedDate = document.getElementById("filterDate").value;
        hb.innerHTML = "";

        // Ensure data is an array before sorting/filtering
        if (!Array.isArray(data)) {
            hb.innerHTML = "<tr><td colspan='4'>❌ डेटा प्रारूप त्रुटि!</td></tr>";
            return;
        }

        const sorted = [...data].reverse();
        const filtered = selectedDate
            ? sorted.filter(e => convertToInputFormat(e.date) === selectedDate)
            : sorted;

        if (filtered.length === 0) {
            hb.innerHTML = "<tr><td colspan='4'>कोई डेटा नहीं मिला।</td></tr>";
            return;
        }

        filtered.forEach((e, index) => {
            // ✅ IN/OUT Status Fix
            const statusText = e.status || 'N/A';
            const icon = statusText.toUpperCase() === "IN" ? "🟢" : "🔴";
            
            // Handle missing phone gracefully
            const phoneData = e.phone || '';
            const maskedPhone = phoneData ? phoneData.replace(/^(\d{2})\d{4}(\d{4})$/, "$1****$2") : "ID Data";
            
            hb.innerHTML += `
                <tr class="${index === 0 ? 'table-info' : ''}">
                    <td><b style="color:var(--primary-color);">${e.name || 'N/A'}</b><br>${maskedPhone}</td>
                    <td>${e.date || 'N/A'}</td>
                    <td>${e.time || 'N/A'}</td>
                    <td>${icon} <b style="font-weight: 700;">${statusText}</b></td>
                </tr>`;
        });
    }

    function downloadHistoryPDF() {
      const element = document.getElementById('historySection');
      const opt = {
        margin: 0.5,
        filename: 'Attendance-History.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    }


