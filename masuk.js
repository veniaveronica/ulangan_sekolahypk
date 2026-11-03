/* ============================================================
   masuk.js  –  Logika halaman Masuk Ulangan
   Membaca data dari Firebase Realtime Database secara real-time.
   Data diisi guru melalui Pengaturan Ulangan.html
   ============================================================ */

var kelas = ['10', '11', '12'];
var mapel = ['Sejarah', 'Bahasa Indonesia', 'PPKn', 'Seni Budaya'];

/* Cache data ulangan dari Firebase (diupdate real-time) */
var daftarUlangan = [];

function $(id) { return document.getElementById(id); }

/**
 * Ubah data mentah Firebase menjadi array objek ulangan
 * format: { n: nama, t: token, u: url, aktif: boolean }
 */
function parseDaftar(raw) {
  var u = [];
  raw = raw || {};
  kelas.forEach(function (k) {
    mapel.forEach(function (m) {
      var d = raw[k + '|' + m];
      if (d && d.t) {
        u.push({
          n:     m + ' (Kelas ' + k + ')',
          t:     d.t,
          u:     d.u || '',
          aktif: d.aktif === '1'
        });
      }
    });
  });
  return u;
}

/* ── Dengarkan perubahan data di Firebase secara real-time ─────────────── */
db.ref('ulangan').on('value', function (snapshot) {
  daftarUlangan = parseDaftar(snapshot.val());

  /* Update peringatan jika data kosong */
  var noticeBox = $('notice-box');
  if (!daftarUlangan.length) {
    noticeBox.innerHTML =
      '<p class="notice">&#9888; Belum ada ujian dikonfigurasi. ' +
      'Minta guru membuka <strong>Pengaturan Ulangan.html</strong> ' +
      'dan mengisi token serta link Google Form.</p>';
  } else {
    noticeBox.innerHTML = '';
  }
}, function (error) {
  /* Jika gagal konek ke Firebase */
  $('notice-box').innerHTML =
    '<p class="notice">&#9888; Gagal terhubung ke database. ' +
    'Periksa koneksi internet kamu.</p>';
  console.error('Firebase error:', error);
});

/* ── Handler form submit siswa ─────────────────────────────────────────── */
$('f').addEventListener('submit', function (e) {
  e.preventDefault();

  var v = $('token').value.trim().toUpperCase();

  /* Cari token di daftar yang sudah di-cache dari Firebase */
  var u = daftarUlangan.filter(function (x) {
    return x.t.toUpperCase() === v;
  })[0];

  if (!u) {
    $('err').textContent = 'Token salah. Periksa lagi atau tanya gurumu.';
    return;
  }
  if (!u.aktif) {
    $('err').textContent = 'Ujian ' + u.n + ' belum dibuka atau sudah ditutup.';
    return;
  }
  if (!u.u) {
    $('err').textContent = 'Link Google Form untuk ' + u.n + ' belum diisi guru.';
    return;
  }

  $('err').textContent  = '';
  $('nama').textContent = u.n;
  $('tautan').href      = u.u;
  $('tautan').target    = '_self';
  $('login').hidden     = true;
  $('siap').hidden      = false;
});

/* ── Handler buka formulir di tab/jendela yang sama ────────────────────── */
$('tautan').addEventListener('click', function (e) {
  var href = this.getAttribute('href');
  if (href && href !== '#' && !href.startsWith('javascript:')) {
    e.preventDefault();
    window.location.href = href;
  }
});

/* ── Handler tombol ganti token ─────────────────────────────────────────── */
$('ganti').addEventListener('click', function () {
  $('token').value  = '';
  $('siap').hidden  = true;
  $('login').hidden = false;
  $('token').focus();
});
