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

/** Simpan seluruh data ke Firebase */
function simpan() {
  db.ref('ulangan').set(data).catch(function (err) {
    console.error('Gagal simpan ke Firebase:', err);
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
      '<h2>Ulangan Kelas ' + k + '</h2>' +
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
          ' type="text" autocomplete="off" placeholder="Token ulangan"></td>' +
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
      simpan(); /* simpan ke Firebase setiap ketikan */
    });
  });

  document.querySelectorAll('input[type=checkbox]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var key = cb.dataset.k + '|' + cb.dataset.m;
      data[key] = data[key] || {};
      data[key]['aktif'] = cb.checked ? '1' : '0';
      var badge = cb.closest('td').querySelector('.badge-aktif');
      if (badge) badge.textContent = cb.checked ? 'Aktif' : 'Nonaktif';
      simpan(); /* simpan ke Firebase setiap toggle */
    });
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

/* ── Muat data dari Firebase, lalu bangun UI ────────────────────────────── */
db.ref('ulangan').once('value', function (snapshot) {
  data = snapshot.val() || {};
  bangunHTML();
  bangunTab();
  isiNilaiInput();
}, function (error) {
  console.error('Gagal muat data dari Firebase:', error);
  /* Tetap bangun UI kosong supaya guru bisa mulai isi */
  bangunHTML();
  bangunTab();
  isiNilaiInput();
});
