// ==========================================
// WEDDING CARD INTERACTIVE SCRIPT
// Quang Anh & Đoàn Diệu Thủy - 10/12/2026
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. HỆ THỐNG NHẠC "MỘT ĐỜI" PHÁT LIÊN TỤC KHÔNG NGẮT
  //    Sử dụng Web Audio API AudioBufferSourceNode với loop = true
  //    đảm bảo phát liền mạch chuẩn xác từng mili-giây!
  // ==========================================
  const openCardBtn = document.getElementById('openCardBtn');
  const envelopeBox = document.getElementById('envelopeBox');
  const envelopeOverlay = document.getElementById('envelopeOverlay');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const musicDisk = musicToggleBtn ? musicToggleBtn.querySelector('.music-disk') : null;
  const bgAudioFallback = document.getElementById('bgAudio');

  let audioCtx = null;
  let audioBuffer = null;
  let sourceNode = null;
  let gainNode = null;
  let isPlaying = false;
  let pauseTime = 0;
  let startTime = 0;

  function initWebAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        fetch('assets/mot_doi.mp3')
          .then(res => res.arrayBuffer())
          .then(buf => audioCtx.decodeAudioData(buf))
          .then(decoded => {
            audioBuffer = decoded;
            // Nếu người dùng đã mở thiệp trước khi decode xong, tự động kích hoạt
            if (isPlaying && !sourceNode) {
              startWebAudioPlayback(0);
            }
          })
          .catch(e => {
            console.log('Web Audio fetch error, fallback to HTML Audio:', e);
          });
      }
    } catch (e) {
      console.log('Web Audio not supported:', e);
    }
  }

  function startWebAudioPlayback(offset = 0) {
    if (!audioCtx || !audioBuffer) return false;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    try {
      if (sourceNode) {
        sourceNode.stop();
        sourceNode.disconnect();
      }
    } catch (e) {}

    sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.loop = true; // Hard real-time hardware sample-accurate seamless looping!

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);

    sourceNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const safeOffset = offset % audioBuffer.duration;
    sourceNode.start(0, safeOffset);
    startTime = audioCtx.currentTime - safeOffset;
    return true;
  }

  function playMusic() {
    isPlaying = true;
    if (musicDisk) musicDisk.classList.add('rotating');

    // Ưu tiên Web Audio API (hoàn toàn không ngắt quãng giữa các vòng lặp)
    const success = startWebAudioPlayback(pauseTime);
    if (!success) {
      // Fallback HTML5 Audio nếu Web Audio chưa decode xong
      if (bgAudioFallback) {
        bgAudioFallback.play().catch(() => {});
      }
    }
  }

  function pauseMusic() {
    isPlaying = false;
    if (musicDisk) musicDisk.classList.remove('rotating');

    if (sourceNode && audioCtx) {
      pauseTime = (audioCtx.currentTime - startTime) % (audioBuffer ? audioBuffer.duration : 1);
      try {
        sourceNode.stop();
        sourceNode.disconnect();
      } catch (e) {}
      sourceNode = null;
    }
    if (bgAudioFallback) {
      bgAudioFallback.pause();
    }
  }

  function toggleMusic() {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }

  // Khởi tạo audio context khi load trang
  initWebAudio();

  // Mở phong bì thư 3D & Chuyển sang chế độ Web App
  if (openCardBtn) {
    openCardBtn.addEventListener('click', () => {
      // Chế độ full màn hình web app trên điện thoại
      if (window.innerWidth <= 768) {
        const docEl = document.documentElement;
        const reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
        if (reqFs) {
          reqFs.call(docEl).catch(() => {});
        }
      }

      envelopeBox.classList.add('open');
      playMusic();

      setTimeout(() => {
        envelopeOverlay.classList.add('opened');
        // Kích hoạt animation khi bắt đầu cuộn
        checkRevealOnScroll();
      }, 900);
    });
  }

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', toggleMusic);
  }

  // ==========================================
  // 2. BỘ ĐẾM NGƯỢC CHÍNH XÁC ĐẾN NGÀY CƯỚI
  // ==========================================
  const weddingDate = new Date(2026, 11, 10, 17, 30, 0).getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    const dEl = document.getElementById('cdDays');
    const hEl = document.getElementById('cdHours');
    const mEl = document.getElementById('cdMins');
    const sEl = document.getElementById('cdSecs');

    if (distance <= 0) {
      if (dEl) dEl.textContent = '00';
      if (hEl) hEl.textContent = '00';
      if (mEl) mEl.textContent = '00';
      if (sEl) sEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
    if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // ==========================================
  // 3. HIỆU ỨNG SCROLL REVEAL
  // ==========================================
  function checkRevealOnScroll() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    const windowHeight = window.innerHeight;

    elements.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;
      if (elementTop < windowHeight - 60) {
        el.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', checkRevealOnScroll);
  window.addEventListener('resize', checkRevealOnScroll);

  // ==========================================
  // 4. FORM XÁC NHẬN THAM DỰ (RSVP)
  // ==========================================
  const rsvpForm = document.getElementById('rsvpForm');
  const wishesList = document.getElementById('wishesList');

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('guestName').value.trim();
      const side = document.getElementById('guestSide').value;
      const wishes = document.getElementById('guestWishes').value.trim();
      const attend = document.querySelector('input[name="attend"]:checked').value;

      if (!name) return;

      const wishItem = document.createElement('div');
      wishItem.className = 'wish-item';
      wishItem.innerHTML = `
        <div class="wish-author">
          <strong>${escapeHTML(name)}</strong>
          <span class="wish-time">${escapeHTML(side)} • Vừa xong</span>
        </div>
        <p class="wish-content">${wishes ? escapeHTML(wishes) : (attend === 'yes' ? 'Rất vui và hạnh phúc khi được đến chung vui cùng Quang Anh & Đoàn Diệu Thủy! ❤️' : 'Gửi lời chúc mừng trăm năm hạnh phúc đến hai bạn!')}</p>
      `;

      if (wishesList) {
        wishesList.insertBefore(wishItem, wishesList.firstChild);
      }

      showToast('Cảm ơn bạn! Đã gửi xác nhận và lời chúc mừng thành công ❤️');
      rsvpForm.reset();
    });
  }

  // ==========================================
  // 5. HỘP MỪNG CƯỚI & TABS
  // ==========================================
  const showQrBtn = document.getElementById('showQrBtn');
  const giftModal = document.getElementById('giftModal');
  const closeGiftModal = document.getElementById('closeGiftModal');
  const tabGroomBtn = document.getElementById('tabGroomBtn');
  const tabBrideBtn = document.getElementById('tabBrideBtn');
  const tabGroom = document.getElementById('tabGroom');
  const tabBride = document.getElementById('tabBride');

  if (showQrBtn && giftModal) {
    showQrBtn.addEventListener('click', () => {
      giftModal.classList.add('active');
    });
  }

  if (closeGiftModal && giftModal) {
    closeGiftModal.addEventListener('click', () => {
      giftModal.classList.remove('active');
    });
  }

  if (giftModal) {
    giftModal.addEventListener('click', (e) => {
      if (e.target === giftModal) {
        giftModal.classList.remove('active');
      }
    });
  }

  if (tabGroomBtn && tabBrideBtn) {
    tabGroomBtn.addEventListener('click', () => {
      tabGroomBtn.classList.add('active');
      tabBrideBtn.classList.remove('active');
      tabGroom.classList.add('active');
      tabBride.classList.remove('active');
    });

    tabBrideBtn.addEventListener('click', () => {
      tabBrideBtn.classList.add('active');
      tabGroomBtn.classList.remove('active');
      tabBride.classList.add('active');
      tabGroom.classList.remove('active');
    });
  }

  // ==========================================
  // 6. THÊM VÀO LỊCH (GOOGLE CALENDAR)
  // ==========================================
  const addCalendarBtn = document.getElementById('addCalendarBtn');
  if (addCalendarBtn) {
    addCalendarBtn.addEventListener('click', () => {
      const title = encodeURIComponent("Lễ Thành Hôn - Quang Anh & Đoàn Diệu Thủy");
      const details = encodeURIComponent("Trân trọng kính mời quý khách tham dự lễ thành hôn của Quang Anh & Đoàn Diệu Thủy tại Trống Đồng Palace, Hà Nội.");
      const location = encodeURIComponent("Trống Đồng Palace, 65 Quán Sứ, Hoàn Kiếm, Hà Nội");
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20261210T103000Z/20261210T143000Z&details=${details}&location=${location}`;
      window.open(gcalUrl, '_blank');
    });
  }

  // ==========================================
  // 7. CHIA SẺ THIỆP
  // ==========================================
  const shareBtnTop = document.getElementById('shareBtnTop');
  if (shareBtnTop) {
    shareBtnTop.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: 'Thiệp Cưới Online - Quang Anh & Đoàn Diệu Thủy',
          text: 'Trân trọng kính mời quý khách tham dự lễ thành hôn của Quang Anh & Đoàn Diệu Thủy!',
          url: window.location.href
        }).catch(err => console.log('Share canceled'));
      } else {
        copyToClipboard(window.location.href);
        showToast('Đã sao chép link thiệp cưới!');
      }
    });
  }

  // ==========================================
  // 8. KHỞI TẠO CÁNH HOA & SAO RƠI
  // ==========================================
  initPetalsCanvas();
});

// Tiện ích Sao chép vào clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Đã sao chép: ' + text);
    });
  } else {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Đã sao chép: ' + text);
  }
}

// Thông báo Toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// Xem ảnh kích thước lớn (Lightbox)
function openLightbox(src) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  if (modal && img) {
    img.src = src;
    modal.classList.add('active');
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Hiệu ứng Canvas: Cánh hoa Sakura, Trái tim nhỏ & Tinh vân bụi sao vàng
function initPetalsCanvas() {
  const canvas = document.getElementById('petalsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = 42;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 9 + 4,
      speedX: Math.random() * 1.4 - 0.7,
      speedY: Math.random() * 1.3 + 0.7,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 2 - 1,
      opacity: Math.random() * 0.45 + 0.35,
      type: Math.random() > 0.65 ? 'heart' : (Math.random() > 0.35 ? 'petal' : 'star'),
      color: Math.random() > 0.5 ? 'rgba(235, 95, 115, ' : 'rgba(212, 175, 55, '
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;

      if (p.y > height + 25) {
        p.y = -25;
        p.x = Math.random() * width;
      }
      if (p.x > width + 25) p.x = -25;
      if (p.x < -25) p.x = width + 25;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color + p.opacity + ')';

      if (p.type === 'heart') {
        const s = p.size * 0.55;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(-s, -s * 0.5, -s * 0.8, s * 0.6, 0, s);
        ctx.bezierCurveTo(s * 0.8, s * 0.6, s, -s * 0.5, 0, s * 0.3);
        ctx.fill();
      } else if (p.type === 'star') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size / 2.2, Math.PI / 4, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();
    });

    requestAnimationFrame(render);
  }

  render();
}
