// =============================================================================
// EXPERT COLOR PALETTE EVALUATION — Ground Truth Collection
// =============================================================================
// Untuk skripsi LinggaArdianz: Color Palette Recommendation System
// Menggunakan DistilBERT + CVAE dengan color psychology analysis
// =============================================================================

// ===== KONFIGURASI =====
// Ganti dengan email/WA peneliti untuk pengiriman manual
const RESEARCHER_EMAIL = 'lingga.ardiansyah11@gmail.com';      // GANTI dengan email Anda
const RESEARCHER_WHATSAPP = '+62 895382017689';         // GANTI dengan nomor WA Anda

const STORAGE_KEY = 'colorPaletteEvaluation_v1';

// ===== DATA KASUS =====
const KASUS = [
    // KESEHATAN
    {'id': 1,  'kat': 'Kesehatan', 'teks_en': 'calm relaxing and peaceful interface for mental wellness', 'teks_id': 'antarmuka yang tenang, santai, dan damai untuk kesehatan mental'},
    {'id': 2,  'kat': 'Kesehatan', 'teks_en': 'clean professional and trustworthy healthcare platform', 'teks_id': 'platform layanan kesehatan yang bersih, profesional, dan terpercaya'},
    {'id': 3,  'kat': 'Kesehatan', 'teks_en': 'soft warm and comforting design for baby care services', 'teks_id': 'desain yang lembut, hangat, dan menenangkan untuk layanan perawatan bayi'},
    // EDUKASI
    {'id': 4,  'kat': 'Edukasi',   'teks_en': 'bright playful and engaging learning application for children', 'teks_id': 'aplikasi pembelajaran yang cerah, ceria, dan menarik untuk anak-anak'},
    {'id': 5,  'kat': 'Edukasi',   'teks_en': 'creative vibrant and energetic educational event poster', 'teks_id': 'poster acara pendidikan yang kreatif, cerah, dan energik'},
    {'id': 6,  'kat': 'Edukasi',   'teks_en': 'a convenient, smart, and academic website for learning', 'teks_id': 'situs web akademik yang nyaman, pintar, dan terpelajar untuk pembelajaran'},
    // FINANSIAL
    {'id': 7,  'kat': 'Finansial', 'teks_en': 'minimal modern and trustworthy personal finance application', 'teks_id': 'aplikasi keuangan pribadi yang minimalis, modern, dan terpercaya'},
    {'id': 8,  'kat': 'Finansial', 'teks_en': 'stable secure and professional banking service platform', 'teks_id': 'platform layanan perbankan yang stabil, aman, dan profesional'},
    {'id': 9,  'kat': 'Finansial', 'teks_en': 'luxurious elegant and sophisticated investment company brand', 'teks_id': 'identitas merek perusahaan investasi yang mewah, elegan, dan mutakhir'},
    // KULINER
    {'id': 10, 'kat': 'Kuliner',   'teks_en': 'warm rich and earthy restaurant branding', 'teks_id': 'identitas merek restoran yang bernuansa hangat, kaya, dan membumi'},
    {'id': 11, 'kat': 'Kuliner',   'teks_en': 'fresh, clean and comfortable flower shop application.', 'teks_id': 'aplikasi toko bunga yang segar, bersih, dan nyaman'},
    {'id': 12, 'kat': 'Kuliner',   'teks_en': 'old spicy and energetic food product branding', 'teks_id': 'identitas merek produk makanan yang bernuansa tua, pedas, dan energik'},
];

// ===== STATE =====
const defaultColors = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'];

let state = {
    expertInfo: {
        name: '',
        institution: '',
        profession: '',
        experience: '',
        email: ''
    },
    consentGiven: false,
    currentStep: 0,  // 0 = start, 1..18 = kasus, 19 = finish
    responses: [],
    startedAt: null,
    downloadedAt: null
};

const appContainer = document.getElementById('app-container');
const toastEl = document.getElementById('toast');

// =============================================================================
// LOCAL STORAGE — Auto-save & Resume
// =============================================================================
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Gagal menyimpan ke localStorage:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.warn('Gagal memuat dari localStorage:', e);
    }
    return null;
}

function clearState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn('Gagal menghapus localStorage:', e);
    }
}

function hasSavedProgress() {
    const saved = loadState();
    return saved && saved.currentStep > 0 && saved.currentStep <= KASUS.length;
}

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================
function showToast(message, type = 'success', duration = 3000) {
    toastEl.textContent = message;
    toastEl.className = `toast ${type} show`;
    setTimeout(() => {
        toastEl.className = 'toast';
    }, duration);
}

// =============================================================================
// VALIDASI WARNA
// =============================================================================
function isDefaultColor(hex) {
    const normalized = hex.toLowerCase();
    return normalized === '#ffffff' || normalized === '#fff';
}

function countUnchangedColors(colors) {
    return colors.filter(c => isDefaultColor(c)).length;
}

// =============================================================================
// RENDER ROUTER
// =============================================================================
function render() {
    if (state.currentStep === 0) {
        renderStartScreen();
    } else if (state.currentStep <= KASUS.length) {
        renderSurveyScreen();
    } else {
        renderFinishScreen();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================================================
// SCREEN 1: START / WELCOME
// =============================================================================
function renderStartScreen() {
    const hasProgress = hasSavedProgress();
    let resumeBannerHtml = '';

    if (hasProgress) {
        const saved = loadState();
        const completed = saved.responses.filter(r => r && r.colors).length;
        resumeBannerHtml = `
            <div class="resume-banner">
                <div class="resume-banner-text">
                    <strong>📋 Progres tersimpan ditemukan</strong><br>
                    Anda sudah menyelesaikan ${completed} dari ${KASUS.length} kasus. Lanjutkan dari kasus ${saved.currentStep}?
                </div>
                <div class="resume-banner-actions">
                    <button id="resume-btn" class="btn-mini btn-mini-primary">Lanjutkan</button>
                    <button id="reset-btn" class="btn-mini btn-mini-secondary">Mulai Ulang</button>
                </div>
            </div>
        `;
    }

    appContainer.innerHTML = `
        <div class="glass-panel" style="padding: 2.5rem; text-align: left;">
            <h1 style="font-size: 2.2rem; margin-bottom: 1rem;">Evaluasi Ahli — Sistem Rekomendasi Palet Warna</h1>

            ${resumeBannerHtml}

            <p class="intro-text" style="color: #cbd5e1; margin-bottom: 1.5rem; font-size: 1rem;">
                <strong>Tentang Sistem:</strong><br>
                Sistem ini merupakan platform rekomendasi palet warna berbasis kecerdasan buatan (AI). Sistem menggunakan model <em>DistilBERT</em> untuk memproses bahasa alami (teks) dan <em>CVAE (Conditional Variational Autoencoder)</em> untuk menghasilkan palet warna, beserta analisis psikologi warnanya.
            </p>

            <p class="intro-text">
                <strong>Peran Anda sebagai Ahli:</strong><br>
                Anda akan diminta membuat <strong>palet warna acuan (ground truth)</strong> sebanyak 5 warna untuk setiap dari 18 deskripsi desain. Palet Anda akan menjadi pembanding objektif untuk mengukur kualitas output sistem AI melalui metrik <em>Delta E</em> (perbedaan warna) dan <em>cosine similarity</em>.
            </p>

            <div class="stats-row">
                <div class="stat-item">
                    <span class="stat-number">12</span>
                    <span class="stat-label">Deskripsi Teks</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">5</span>
                    <span class="stat-label">Warna per Palet</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">±20</span>
                    <span class="stat-label">Menit</span>
                </div>
            </div>

            <div class="consent-box">
                <h3>📄 Persetujuan Partisipasi (Informed Consent)</h3>
                <p>Dengan berpartisipasi dalam evaluasi ini, Anda memahami bahwa:</p>
                <ul>
                    <li>Data yang dikumpulkan (nama, institusi, profesi, dan palet warna) akan digunakan <strong>khusus untuk keperluan penelitian skripsi</strong>.</li>
                    <li>Identitas Anda akan disebutkan sebagai <strong>respondent ahli</strong> dalam laporan penelitian (jika diizinkan), atau dapat dianonimkan atas permintaan.</li>
                    <li>Anda dapat <strong>berhenti kapan saja</strong> tanpa konsekuensi.</li>
                    <li>Partisipasi Anda bersifat <strong>sukarela dan tanpa kompensasi finansial</strong>.</li>
                </ul>
            </div>

            <div class="info-box" style="margin-bottom: 2rem;">
                <div class="info-box-title">📌 Cara Pengumpulan Data</div>
                <p>
                    Setelah menyelesaikan 18 kasus, Anda akan diminta <strong>mengunduh file JSON</strong> berisi jawaban Anda, lalu mengirimkannya ke peneliti via email atau WhatsApp. Petunjuk lengkap akan ditampilkan di akhir evaluasi.
                </p>
            </div>

            <form id="start-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="name">Nama Lengkap <span class="required">*</span></label>
                        <input type="text" id="name" placeholder="Nama lengkap Anda" required value="${escapeHtml(state.expertInfo.name)}">
                    </div>
                    <div class="form-group">
                        <label for="institution">Institusi / Perusahaan <span class="required">*</span></label>
                        <input type="text" id="institution" placeholder="Tempat bekerja/kuliah (tulis 'Freelance' jika tidak ada)" required value="${escapeHtml(state.expertInfo.institution)}">
                    </div>
                </div>

                <div class="form-group">
                    <label for="email">Email (opsional)</label>
                    <input type="email" id="email" placeholder="email@example.com" value="${escapeHtml(state.expertInfo.email)}">
                </div>

                <div class="form-group" style="margin-top: 1rem;">
                    <label for="profession">Bidang Keahlian <span class="required">*</span></label>
                    <input type="text" id="profession" placeholder="Sebutkan bidang keahlian Anda (contoh: Desainer Grafis)" required value="${escapeHtml(state.expertInfo.profession)}">
                </div>

                <div class="form-group">
                    <label class="radio-group-label">Pengalaman di bidang desain / warna <span class="required">*</span></label>
                    <div class="radio-list">
                        ${renderExperienceRadios()}
                    </div>
                </div>

                <div class="form-group">
                    <label class="radio-option" style="background: rgba(134, 239, 172, 0.05); border-color: rgba(134, 239, 172, 0.2);">
                        <input type="checkbox" id="consent-checkbox" required ${state.consentGiven ? 'checked' : ''}>
                        <div class="radio-circle"></div>
                        <span class="radio-label-text">
                            Saya telah membaca dan <strong>menyetujui</strong> persetujuan partisipasi di atas. <span class="required">*</span>
                        </span>
                    </label>
                </div>

                <button type="submit" class="btn">Mulai Evaluasi</button>
            </form>
        </div>
    `;

    // Resume button
    if (hasProgress) {
        document.getElementById('resume-btn').addEventListener('click', () => {
            const saved = loadState();
            state = saved;
            render();
        });
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('Yakin ingin memulai ulang? Semua progres akan terhapus.')) {
                clearState();
                state = {
                    expertInfo: { name: '', institution: '', profession: '', experience: '', email: '' },
                    consentGiven: false,
                    currentStep: 0,
                    responses: [],
                    startedAt: null,
                    downloadedAt: null
                };
                render();
            }
        });
    }

    // Profession text input handled directly from id="profession"

    // Submit handler
    document.getElementById('start-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const institution = document.getElementById('institution').value.trim();
        const email = document.getElementById('email').value.trim();
        const consentCheckbox = document.getElementById('consent-checkbox');

        const profession = document.getElementById('profession').value.trim();
        const expRadio = document.querySelector('input[name="experience"]:checked');

        if (!name || !institution) {
            showToast('Mohon lengkapi nama dan institusi.', 'warning');
            return;
        }
        if (!profession) {
            showToast('Mohon isi bidang keahlian.', 'warning');
            return;
        }
        if (!expRadio) {
            showToast('Mohon pilih pengalaman.', 'warning');
            return;
        }
        if (!consentCheckbox.checked) {
            showToast('Anda harus menyetujui persetujuan partisipasi.', 'warning');
            return;
        }

        state.expertInfo.name = name;
        state.expertInfo.institution = institution;
        state.expertInfo.email = email;
        state.expertInfo.profession = profession;
        state.expertInfo.experience = expRadio.value;
        state.consentGiven = true;
        state.startedAt = new Date().toISOString();
        state.currentStep = 1;

        saveState();
        render();
    });
}

function renderExperienceRadios() {
    const options = ['1 tahun', '2 tahun', '3 tahun', '4 tahun', '5 tahun', '5+ tahun'];
    return options.map(opt => `
        <label class="radio-option">
            <input type="radio" name="experience" value="${opt}" ${state.expertInfo.experience === opt ? 'checked' : ''}>
            <div class="radio-circle"></div>
            <span class="radio-label-text">${opt}</span>
        </label>
    `).join('');
}

// =============================================================================
// SCREEN 2: SURVEY (per kasus)
// =============================================================================
function renderSurveyScreen() {
    const currentIndex = state.currentStep - 1;
    const currentKasus = KASUS[currentIndex];
    const existingResponse = state.responses[currentIndex] || { colors: [...defaultColors] };
    const progressPercent = (state.currentStep / KASUS.length) * 100;

    appContainer.innerHTML = `
        <div class="glass-panel">
            <div class="survey-header">
                <span class="step-counter">Tugas ${state.currentStep} dari ${KASUS.length} • Kategori: <strong style="color: #86efac;">${currentKasus.kat}</strong></span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>

            <div class="kasus-card">
                <span class="kasus-category">${currentKasus.kat}</span>
                <p class="kasus-text" style="font-size: 1.4rem; color: #a5b4fc; margin-bottom: 0.5rem; font-style: italic;">"${currentKasus.teks_en}"</p>
                <p class="kasus-text">"${currentKasus.teks_id}"</p>
            </div>

            <div class="color-palette-section">
                <p class="palette-instruction">Buatlah palet berisi <strong>5 warna</strong> yang paling mewakili deskripsi di atas.</p>
                <p class="palette-hint">Klik setiap lingkaran untuk memilih warna. Susunan tidak harus berurutan.</p>
                <div class="color-palette" id="palette-container"></div>
            </div>

            <button id="next-btn" class="btn">${state.currentStep === KASUS.length ? 'Selesai & Lanjut ke Pengiriman' : 'Selanjutnya'}</button>
            ${state.currentStep > 1 ? '<button id="back-btn" class="btn btn-secondary">Kembali</button>' : ''}
        </div>
    `;

    const paletteContainer = document.getElementById('palette-container');

    for (let i = 0; i < 5; i++) {
        const colorValue = existingResponse.colors[i] || '#ffffff';
        const wrapper = document.createElement('div');
        wrapper.className = 'color-swatch-wrapper';
        wrapper.innerHTML = `
            <input type="color" class="color-picker" id="color-${i}" value="${colorValue}">
            <input type="text" class="color-hex-input" id="hex-${i}" value="${colorValue.toUpperCase()}" maxlength="7" spellcheck="false">
        `;
        paletteContainer.appendChild(wrapper);

        const picker = document.getElementById(`color-${i}`);
        const hexInput = document.getElementById(`hex-${i}`);

        picker.addEventListener('input', (e) => {
            hexInput.value = e.target.value.toUpperCase();
        });

        hexInput.addEventListener('input', (e) => {
            let val = e.target.value;
            if (!val.startsWith('#')) {
                val = '#' + val.replace(/[^0-9A-Fa-f]/g, '');
                e.target.value = val;
            } else {
                val = '#' + val.substring(1).replace(/[^0-9A-Fa-f]/g, '');
                e.target.value = val;
            }
            if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                picker.value = val;
            }
        });

        hexInput.addEventListener('blur', (e) => {
            let val = e.target.value;
            if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                if (val.length === 4) {
                    val = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
                }
                hexInput.value = val.toUpperCase();
                picker.value = val;
            } else {
                hexInput.value = picker.value.toUpperCase();
            }
        });
    }

    document.getElementById('next-btn').addEventListener('click', () => {
        const colors = [];
        for (let i = 0; i < 5; i++) {
            colors.push(document.getElementById(`color-${i}`).value);
        }

        // Validasi: berapa warna yang masih putih (belum diubah)?
        const unchanged = countUnchangedColors(colors);
        if (unchanged >= 3) {
            const proceed = confirm(`⚠️ Peringatan: ${unchanged} dari 5 warna Anda masih putih (#FFFFFF).\n\nApakah ini memang pilihan yang Anda inginkan? Klik OK untuk melanjutkan, atau Cancel untuk mengubah.`);
            if (!proceed) return;
        }

        state.responses[currentIndex] = {
            id: currentKasus.id,
            kategori: currentKasus.kat,
            teks_en: currentKasus.teks_en,
            teks_id: currentKasus.teks_id,
            colors: colors,
            submitted_at: new Date().toISOString()
        };

        state.currentStep++;
        saveState();
        render();
    });

    if (state.currentStep > 1) {
        document.getElementById('back-btn').addEventListener('click', () => {
            const colors = [];
            for (let i = 0; i < 5; i++) {
                colors.push(document.getElementById(`color-${i}`).value);
            }
            state.responses[currentIndex] = {
                id: currentKasus.id,
                kategori: currentKasus.kat,
                teks_en: currentKasus.teks_en,
                teks_id: currentKasus.teks_id,
                colors: colors,
                submitted_at: new Date().toISOString()
            };
            state.currentStep--;
            saveState();
            render();
        });
    }
}

// =============================================================================
// SCREEN 3: FINISH
// =============================================================================
function renderFinishScreen() {
    const finalData = buildFinalData();

    // Mailto link untuk memudahkan pengiriman email
    const mailtoSubject = encodeURIComponent(`[Skripsi] Data Evaluasi Ahli - ${state.expertInfo.name}`);
    const mailtoBody = encodeURIComponent(
        `Halo,\n\nBerikut data evaluasi palet warna saya.\n\nNama: ${state.expertInfo.name}\nInstitusi: ${state.expertInfo.institution}\n\nFile JSON sudah saya unduh dan saya lampirkan di email ini.\n\nTerima kasih.`
    );
    const mailtoLink = `mailto:${RESEARCHER_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

    // WhatsApp link (hapus karakter non-digit dari nomor)
    const waNumber = RESEARCHER_WHATSAPP.replace(/[^\d]/g, '');
    const waMessage = encodeURIComponent(`Halo, saya ${state.expertInfo.name} sudah menyelesaikan evaluasi palet warna. Berikut saya kirimkan file JSON-nya.`);
    const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

    appContainer.innerHTML = `
        <div class="glass-panel finish-screen">
            <div class="icon-wrapper"></div>
            <h1 style="background: linear-gradient(135deg, #ffffff 0%, #86efac 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Evaluasi Selesai!</h1>
            <p class="subtitle">Terima kasih, <strong style="color: #86efac;">${escapeHtml(state.expertInfo.name)}</strong>, atas waktu dan keahlian yang Anda luangkan.</p>

            <div class="steps-box">
                <div class="steps-title">Langkah Pengiriman Data</div>
                <div class="step-item">
                    <div class="step-number" id="step-1-num">1</div>
                    <div class="step-content">
                        <strong>Unduh file JSON berisi jawaban Anda</strong>
                        <p>Klik tombol "Unduh File JSON" di bawah. File akan tersimpan di folder Download.</p>
                    </div>
                </div>
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <strong>Kirimkan file tersebut ke peneliti</strong>
                        <p>Lampirkan file JSON yang sudah diunduh melalui email atau WhatsApp di bawah.</p>
                    </div>
                </div>
            </div>

            <button id="download-json-btn" class="btn">Unduh File JSON</button>

            <div class="info-box" style="margin-top: 2rem;">
                <div class="info-box-title">Kirimkan file JSON ke:</div>
                <div class="contact-row">
                    <div class="contact-label">Email</div>
                    <div class="contact-value">
                        <a href="${mailtoLink}" class="contact-link">${RESEARCHER_EMAIL}</a>
                    </div>
                </div>
                <div class="contact-row">
                    <div class="contact-label">WhatsApp</div>
                    <div class="contact-value">
                        <a href="${waLink}" target="_blank" rel="noopener" class="contact-link">${RESEARCHER_WHATSAPP}</a>
                    </div>
                </div>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">
                    Klik salah satu kontak di atas untuk membuka aplikasi email/WhatsApp dengan pesan yang sudah disiapkan. Jangan lupa <strong>lampirkan file JSON</strong> yang sudah diunduh.
                </p>
            </div>

            <div id="download-confirmation" style="display: none; margin-top: 1.5rem;">
                <div class="success-box">
                    ✓ File JSON sudah diunduh. Silakan kirim ke email atau WhatsApp di atas. <strong>Halaman ini boleh ditutup setelah file terkirim.</strong>
                </div>
            </div>
        </div>
    `;

    // Download JSON button
    document.getElementById('download-json-btn').addEventListener('click', () => {
        downloadJson(finalData);
        state.downloadedAt = new Date().toISOString();
        saveState();
        document.getElementById('download-confirmation').style.display = 'block';
        const stepNum = document.getElementById('step-1-num');
        stepNum.innerHTML = '✓';
        stepNum.classList.add('completed');
        showToast('File JSON berhasil diunduh!', 'success');
    });
}

function buildFinalData() {
    return {
        expert_info: state.expertInfo,
        consent_given: state.consentGiven,
        started_at: state.startedAt,
        finished_at: new Date().toISOString(),
        total_cases: KASUS.length,
        evaluations: state.responses,
        meta: {
            user_agent: navigator.userAgent,
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
        }
    };
}

function downloadJson(data) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeName = (state.expertInfo.name || 'anonim').replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluasi_ahli_${safeName}_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// =============================================================================
// UTILITIES
// =============================================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// =============================================================================
// AUTO-SAVE on page unload
// =============================================================================
window.addEventListener('beforeunload', (e) => {
    // Warn jika di tengah survey (belum selesai)
    if (state.currentStep > 0 && state.currentStep <= KASUS.length) {
        saveState();
        e.preventDefault();
        e.returnValue = 'Progres Anda sudah tersimpan otomatis. Yakin ingin meninggalkan halaman?';
        return e.returnValue;
    }
    // Warn jika sudah di finish screen tapi belum download JSON
    if (state.currentStep > KASUS.length && !state.downloadedAt) {
        e.preventDefault();
        e.returnValue = 'Anda belum mengunduh file JSON! Data Anda akan hilang. Yakin ingin keluar?';
        return e.returnValue;
    }
});

// =============================================================================
// INITIALIZE
// =============================================================================
render();
