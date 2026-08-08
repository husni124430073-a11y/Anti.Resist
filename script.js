// ==========================================
// AntiResist - Sistem Monitoring Antibiotik
// ==========================================

// Navigasi Tab
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabId = 'tab-' + btn.dataset.tab;
        tabContents.forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    });
});

// Data pasien (simulasi database)
const patientData = {
    budi: {
        name: 'Budi Santoso',
        rm: 'RM-2024001',
        compliance: 95,
        drug: 'Amoxicillin 500mg',
        color: 'green'
    },
    ani: {
        name: 'Ani Rahmawati',
        rm: 'RM-2024002',
        compliance: 88,
        drug: 'Ciprofloxacin 250mg',
        color: 'green'
    },
    cahyo: {
        name: 'Cahyo Prasetyo',
        rm: 'RM-2024003',
        compliance: 45,
        drug: 'Amoxicillin 500mg',
        color: 'red'
    }
};

// ==========================================
// Form Input Resep
// ==========================================
document.getElementById('prescriptionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = {
        patientName: document.getElementById('patientName').value,
        medicalRecord: document.getElementById('medicalRecord').value,
        age: document.getElementById('patientAge').value,
        weight: document.getElementById('patientWeight').value,
        antibiotic: document.getElementById('antibioticType').value,
        dosage: document.getElementById('dosage').value,
        frequency: document.getElementById('frequency').value,
        duration: document.getElementById('duration').value,
        startDate: document.getElementById('startDate').value,
        notes: document.getElementById('notes').value
    };

    // Validasi
    if (!formData.patientName || !formData.antibiotic) {
        alert('Mohon lengkapi data pasien dan jenis antibiotik.');
        return;
    }

    // Simulasi simpan
    console.log('Resep tersimpan:', formData);
    document.getElementById('inputSuccess').style.display = 'block';
    
    // Reset form setelah 3 detik
    setTimeout(() => {
        this.reset();
        document.getElementById('inputSuccess').style.display = 'none';
    }, 3000);
});

// ==========================================
// Konfirmasi Dosis Pasien
// ==========================================
const doseButtons = document.querySelectorAll('.btn-taken, .btn-late, .btn-missed');
let confirmedDoses = {};
let doseTimers = {};

function confirmDose(status) {
    const doseCard = event.target.closest('.dose-card');
    const timeLabel = doseCard.querySelector('.time-label').textContent;
    const doseKey = `dose_${timeLabel}`;
    
    // Cegah konfirmasi ganda
    if (confirmedDoses[doseKey]) {
        showToast('Dosis ini sudah dikonfirmasi sebelumnya.', 'warning');
        return;
    }
    
    confirmedDoses[doseKey] = true;
    
    // Update tampilan
    doseCard.classList.remove('active');
    doseCard.classList.add('taken');
    const statusBadge = doseCard.querySelector('.status-badge');
    const btnGroup = doseCard.querySelector('.btn-group');
    
    const statusConfig = {
        taken: { text: '✅ Sudah Minum', class: 'taken', toastMsg: 'Konfirmasi: Sudah minum obat tercatat.', toastType: 'success' },
        late: { text: '⏰ Terlambat', class: 'pending', toastMsg: 'Konfirmasi: Keterlambatan tercatat. Harap lebih tepat waktu.', toastType: 'warning' },
        missed: { text: '❌ Terlewat', class: 'pending', toastMsg: 'Konfirmasi: Dosis terlewat tercatat. Segera konsultasi dengan dokter.', toastType: 'error' }
    };
    
    const config = statusConfig[status];
    statusBadge.textContent = config.text;
    statusBadge.className = `status-badge ${config.class}`;
    
    btnGroup.innerHTML = '<button class="btn-status done" disabled>Sudah Dikonfirmasi</button>';
    
    showToast(config.toastMsg, config.toastType);
    
    // Auto-konfirmasi "Terlewat" jika melebihi 4 jam
    const now = new Date();
    const doseTime = new Date();
    const hourMap = { 'Pagi': 8, 'Siang': 14, 'Malam': 20 };
    doseTime.setHours(hourMap[timeLabel], 0, 0, 0);
    
    if (now - doseTime > 4 * 60 * 60 * 1000 && status !== 'missed') {
        setTimeout(() => {
            showToast('⏰ Dosis sudah melewati batas waktu 4 jam. Disarankan konsultasi.', 'warning');
        }, 1500);
    }
}

function showToast(message, type) {
    const toast = document.getElementById('confirmFeedback');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ==========================================
// Laporan Kepatuhan
// ==========================================
function loadReport() {
    const select = document.getElementById('reportPatientSelect');
    const patientId = select.value;
    const data = patientData[patientId];
    
    // Update compliance circle
    const circleProgress = document.querySelector('.circle-progress');
    const circlePercent = document.querySelector('.circle-percent');
    const reportContent = document.getElementById('reportContent');
    
    circleProgress.className = `circle-progress ${data.color}`;
    
    const dashOffset = 283 - (283 * data.compliance / 100);
    circleProgress.style.strokeDashoffset = dashOffset;
    circlePercent.textContent = data.compliance + '%';
    
    // Update detail pasien
    const detailRows = reportContent.querySelectorAll('.compliance-details .detail-row');
    if (detailRows.length >= 4) {
        detailRows[0].querySelector('strong').textContent = data.name;
        detailRows[1].querySelector('strong').textContent = data.drug;
        
        const statusBadge = detailRows[3].querySelector('.badge');
        statusBadge.className = 'badge ' + data.color;
        statusBadge.textContent = data.compliance < 60 ? 'Risiko Resistensi Tinggi' : 
                                 data.compliance < 80 ? 'Perlu Perhatian' : 'Kepatuhan Baik';
    }
    
    // Update heatmap
    const heatmapContainer = document.getElementById('heatmapContainer');
    if (data.compliance < 60) {
        // Pola tidak patuh
        updateHeatmap('low');
    } else if (data.compliance < 85) {
        updateHeatmap('medium');
    } else {
        updateHeatmap('high');
    }
    
    // Update activity log
    updateActivityLog(data);
}

function updateHeatmap(pattern) {
    const cells = document.querySelectorAll('.heatmap-cell');
    const patterns = {
        high: ['green', 'green', 'green', 'green', 'green', 'green', 'green',
               'green', 'green', 'green', 'green', 'green', 'green', 'green'],
        medium: ['green', 'yellow', 'green', 'green', 'yellow', 'green', 'yellow',
                 'green', 'yellow', 'green', 'yellow', 'green', 'green', 'yellow'],
        low: ['green', 'yellow', 'red', 'yellow', 'green', 'red', 'red',
              'red', 'green', 'red', 'yellow', 'red', 'green', 'red']
    };
    
    cells.forEach((cell, i) => {
        cell.className = 'heatmap-cell ' + patterns[pattern][i];
        const emojis = { green: '✅', yellow: '⏰', red: '❌' };
        cell.textContent = emojis[patterns[pattern][i]];
    });
}

function updateActivityLog(data) {
    const logContainer = document.getElementById('activityLog');
    const logs = {
        budi: [
            { type: 'taken', time: '07 Mar 20:02', desc: 'Dosis malam - Tepat Waktu' },
            { type: 'taken', time: '07 Mar 08:01', desc: 'Dosis pagi - Tepat Waktu' },
            { type: 'taken', time: '06 Mar 20:05', desc: 'Dosis malam - Tepat Waktu' },
            { type: 'late', time: '06 Mar 08:15', desc: 'Dosis pagi - Terlambat' },
            { type: 'taken', time: '05 Mar 20:00', desc: 'Dosis malam - Tepat Waktu' },
        ],
        ani: [
            { type: 'taken', time: '07 Mar 20:03', desc: 'Dosis malam - Tepat Waktu' },
            { type: 'late', time: '07 Mar 08:20', desc: 'Dosis pagi - Terlambat' },
            { type: 'taken', time: '06 Mar 20:01', desc: 'Dosis malam - Tepat Waktu' },
            { type: 'taken', time: '06 Mar 08:00', desc: 'Dosis pagi - Tepat Waktu' },
            { type: 'late', time: '05 Mar 20:30', desc: 'Dosis malam - Terlambat' },
        ],
        cahyo: [
            { type: 'missed', time: '07 Mar 20:30', desc: 'Dosis malam - Terlewat' },
            { type: 'missed', time: '07 Mar 08:15', desc: 'Dosis pagi - Terlewat' },
            { type: 'taken', time: '06 Mar 20:02', desc: 'Dosis malam - Tepat Waktu' },
            { type: 'missed', time: '06 Mar 08:00', desc: 'Dosis pagi - Terlewat' },
            { type: 'late', time: '05 Mar 20:45', desc: 'Dosis malam - Terlambat' },
        ]
    };
    
    const patientLogs = logs[Object.keys(patientData).find(k => patientData[k].name === data.name)] || logs.cahyo;
    
    logContainer.innerHTML = patientLogs.map(log => `
        <div class="log-item ${log.type}">
            <span class="log-time">${log.time}</span>
            <span class="log-desc">${log.desc}</span>
        </div>
    `).join('');
}

// ==========================================
// Reminder Otomatis (Simulasi)
// ==========================================
function checkUpcomingDoses() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Cek dosis yang mendekati waktu minum (30 menit sebelumnya)
    const doseTimes = [
        { label: 'Pagi', hour: 8, min: 0 },
        { label: 'Siang', hour: 14, min: 0 },
        { label: 'Malam', hour: 20, min: 0 }
    ];
    
    doseTimes.forEach(dose => {
        const timeDiff = (dose.hour * 60 + dose.min) - (hours * 60 + minutes);
        if (timeDiff === 30) {
            showToast(`🔔 Pengingat: Jadwal minum obat ${dose.label} dalam 30 menit (pukul ${dose.hour}:00).`, 'warning');
        } else if (timeDiff === 0) {
            showToast(`🔔 Waktunya minum obat ${dose.label}! Segera konfirmasi setelah minum.`, 'success');
        }
    });
    
    // Peringatan dosis terlewat (1 jam setelah jadwal)
    doseTimes.forEach(dose => {
        const timeElapsed = (hours * 60 + minutes) - (dose.hour * 60 + dose.min);
        if (timeElapsed === 60) {
            const doseKey = `dose_${dose.label}`;
            if (!confirmedDoses[doseKey]) {
                showToast(`⚠️ Dosis ${dose.label} belum dikonfirmasi. Sudah terlambat 1 jam.`, 'error');
            }
        }
    });
}

// Cek setiap menit
setInterval(checkUpcomingDoses, 60000);
checkUpcomingDoses(); // Cek saat load

// ==========================================
// Inisialisasi Data Awal
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Load laporan default (Cahyo - risiko tinggi)
    document.getElementById('reportPatientSelect').value = 'cahyo';
    loadReport();
    
    // Set tanggal default form
    document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
});