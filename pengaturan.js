/* ============================================================
   pengaturan.js  –  Logika halaman Pengaturan Ulangan
   Data disimpan ke Firebase Realtime Database.
   Format key Firebase: "KELAS|MAPEL"
   Format value: { t: "TOKEN", u: "URL", aktif: "1"|"0" }
   ============================================================ */

var kelas  = ['10', '11', '12'];
var mapel  = ['Sejarah', 'Bahasa Indonesia', 'PPKn', 'Seni Budaya'];

/* Data lokal (sinkron dengan Firebase) */
var data = {};

function $(id) { return document.getElementById(id); }

/** Ambil nilai field tertentu untuk kelas k dan mapel m */
function ambil(k, m, f) {
  return (data[k + '|' + m] && data[k + '|' + m][f]) || '';
}

var adaPerubahan = false;
var perubahanLokal = {};
var isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;

function setStatus(tipe, teks) {
  var badge = $('status-badge');
  var txt   = $('status-text');
  if (!badge || !txt) return;

  badge.className = 'status-badge status-' + tipe;
  txt.textContent = teks;
}

function setKoneksi(online) {
  isOnline = online;
  var alertBox = $('offline-alert');

  if (!online) {
    if (alertBox) alertBox.hidden = false;
    setStatus('offline', 'Offline');
  } else {
    if (alertBox) alertBox.hidden = true;
    if (adaPerubahan) {
      setStatus('unsaved', 'Belum disimpan');
    } else {
      setStatus('saved', 'Tersimpan');
    }
  }
}

function updateTombolSimpan() {
  var btn = $('btn-simpan');
  if (!btn) return;
  btn.disabled = !adaPerubahan;
  btn.textContent = adaPerubahan ? 'Simpan Perubahan' : 'Berhasil Disimpan';
}

/* ── Deteksi Sinyal & Status Koneksi Internet ───────────────────────────── */
db.ref('.info/connected').on('value', function (snap) {
  setKoneksi(snap.val() === true);
});

window.addEventListener('online', function () { setKoneksi(true); });
window.addEventListener('offline', function () { setKoneksi(false); });

/** Simpan seluruh data ke Firebase */
function simpan() {
  if (!isOnline) {
    alert('Koneksi internet terputus (Offline). Periksa sinyal internet Anda sebelum menyimpan.');
    return;
  }

  var btn = $('btn-simpan');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';
  }
  setStatus('saving', 'Menyimpan...');

  db.ref('ulangan').set(data).then(function () {
    adaPerubahan = false;
    perubahanLokal = {};
    setStatus('saved', 'Tersimpan');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Berhasil Disimpan';
    }
  }).catch(function (err) {
    console.error('Gagal simpan ke Firebase:', err);
    setStatus('error', 'Gagal menyimpan');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Coba Simpan Lagi';
    }
  });
}

/* ── Bangun HTML tabel per kelas ────────────────────────────────────────── */
function bangunHTML() {
  var html = '';
  kelas.forEach(function (k) {
    html +=
      '<section class="kelas" role="tabpanel" id="p-' + k +
      '" aria-labelledby="tab-' + k + '"' +
      (k !== kelas[0] ? ' hidden' : '') + '>' +
      '<h2>Ujian Kelas ' + k + '</h2>' +
      '<div class="tw"><table>' +
      '<thead><tr>' +
        '<th scope="col">Mata pelajaran</th>' +
        '<th scope="col">Token</th>' +
        '<th scope="col">Link Google Form</th>' +
        '<th scope="col">Aktif</th>' +
      '</tr></thead><tbody>';

    mapel.forEach(function (m) {
      var id      = k + '-' + m.replace(/\s/g, '');
      var isAktif = ambil(k, m, 'aktif') === '1';

      html +=
        '<tr>' +
        '<th scope="row">' + m + '</th>' +
        '<td><input id="t-' + id + '" aria-label="Token ' + m + ' kelas ' + k +
          '" data-k="' + k + '" data-m="' + m + '" data-f="t"' +
          ' type="text" autocomplete="off" placeholder="Token ujian"></td>' +
        '<td><input id="u-' + id + '" aria-label="Link Google Form ' + m + ' kelas ' + k +
          '" data-k="' + k + '" data-m="' + m + '" data-f="u"' +
          ' type="url" autocomplete="off" placeholder="https://forms.gle/..."></td>' +
        '<td style="text-align:center">' +
          '<label class="switch" aria-label="Aktifkan ' + m + ' kelas ' + k + '">' +
            '<input id="a-' + id + '" type="checkbox"' +
              ' data-k="' + k + '" data-m="' + m + '" data-f="aktif"' +
              (isAktif ? ' checked' : '') + '>' +
            '<span class="slider"></span>' +
          '</label>' +
          '<span class="badge-aktif">' + (isAktif ? 'Aktif' : 'Nonaktif') + '</span>' +
        '</td>' +
        '</tr>';
    });

    html += '</tbody></table></div></section>';
  });
  $('grid').innerHTML = html;
}

/** Isi nilai input dari data yang sudah dimuat */
function isiNilaiInput() {
  document.querySelectorAll('input[type=text], input[type=url]').forEach(function (el) {
    el.value = ambil(el.dataset.k, el.dataset.m, el.dataset.f);

    el.addEventListener('input', function () {
      var key = el.dataset.k + '|' + el.dataset.m;
      data[key] = data[key] || {};
      data[key][el.dataset.f] = el.value.trim();
      if (el.dataset.f === 'u') {
        el.setAttribute('aria-invalid',
          el.value.trim() && !/^https:\/\//i.test(el.value.trim()) ? 'true' : 'false');
      }
      adaPerubahan = true;
      perubahanLokal[key] = true;
      updateTombolSimpan();
      if (isOnline) setStatus('unsaved', 'Belum disimpan');
    });
  });

  document.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var key = cb.dataset.k + '|' + cb.dataset.m;
      data[key] = data[key] || {};
      data[key]['aktif'] = cb.checked ? '1' : '0';
      var badge = cb.closest('td').querySelector('.badge-aktif');
      if (badge) badge.textContent = cb.checked ? 'Aktif' : 'Nonaktif';
      adaPerubahan = true;
      perubahanLokal[key] = true;
      updateTombolSimpan();
      if (isOnline) setStatus('unsaved', 'Belum disimpan');
    });
  });
}

/** Perbarui nilai input dari data terbaru tanpa menimpa yang sedang diedit */
function perbaruiNilaiInput() {
  document.querySelectorAll('input[type=text], input[type=url]').forEach(function (el) {
    var key = el.dataset.k + '|' + el.dataset.m;
    // Jangan ubah input yang sedang aktif difokus/diketik atau ada editan lokal
    if (el !== document.activeElement && !perubahanLokal[key]) {
      el.value = ambil(el.dataset.k, el.dataset.m, el.dataset.f);
    }
  });

  document.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
    var key = cb.dataset.k + '|' + cb.dataset.m;
    if (!perubahanLokal[key]) {
      var isAktif = ambil(cb.dataset.k, cb.dataset.m, 'aktif') === '1';
      cb.checked = isAktif;
      var badge = cb.closest('td').querySelector('.badge-aktif');
      if (badge) badge.textContent = isAktif ? 'Aktif' : 'Nonaktif';
    }
  });
}

/* ── Bangun tab kelas ───────────────────────────────────────────────────── */
function bangunTab() {
  var th = '';
  kelas.forEach(function (k, i) {
    th +=
      '<button class="tab" role="tab" id="tab-' + k +
      '" data-k="' + k + '" aria-controls="p-' + k +
      '" aria-selected="' + (i === 0) + '">' +
      'Kelas ' + k + '</button>';
  });
  $('tabs').innerHTML = th;

  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) {
        x.setAttribute('aria-selected', x === b ? 'true' : 'false');
      });
      kelas.forEach(function (k) { $('p-' + k).hidden = (k !== b.dataset.k); });
    });
  });
}

/* ── Handler tombol simpan manual di bawah ─────────────────────────────── */
$('btn-simpan').addEventListener('click', function () {
  simpan();
});

/* Peringatkan jika keluar tab saat ada perubahan belum disimpan */
window.addEventListener('beforeunload', function (e) {
  if (adaPerubahan) {
    e.preventDefault();
    e.returnValue = '';
  }
});

var uiSudahDibangun = false;

/* ── Sinkronisasi data real-time dari Firebase agar tidak bentrok/nabrak ─── */
db.ref('ulangan').on('value', function (snapshot) {
  var dataServer = snapshot.val() || {};

  // Muat pertama kali & bangun UI
  if (!uiSudahDibangun) {
    data = dataServer;
    bangunHTML();
    bangunTab();
    isiNilaiInput();
    uiSudahDibangun = true;
    updateTombolSimpan();
    if (isOnline) setStatus('saved', 'Tersimpan');
    return;
  }

  // Jika ada update dari perangkat lain di server, gabungkan tanpa menimpa editan lokal
  Object.keys(dataServer).forEach(function (k) {
    if (!perubahanLokal[k]) {
      data[k] = dataServer[k];
    }
  });

  // Hapus data lokal yang sudah dihapus di server (jika tidak diedit)
  Object.keys(data).forEach(function (k) {
    if (!dataServer[k] && !perubahanLokal[k]) {
      delete data[k];
    }
  });

  perbaruiNilaiInput();
  updateTombolSimpan();

  if (isOnline && !adaPerubahan) {
    setStatus('saved', 'Tersimpan');
  }
}, function (error) {
  console.error('Gagal dengarkan Firebase:', error);
  if (!uiSudahDibangun) {
    bangunHTML();
    bangunTab();
    isiNilaiInput();
    uiSudahDibangun = true;
  }
  setKoneksi(false);
});
