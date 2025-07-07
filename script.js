   
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const contentEl = document.getElementById('content');
            const searchInput = document.getElementById('search-input');
            const searchBtn = document.getElementById('search-btn');
            const player = document.getElementById('player');
            const playBtn = document.getElementById('play-btn');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const closePlayer = document.getElementById('close-player');
            const progressBar = document.getElementById('progress-bar');
            const progress = document.getElementById('progress');
            const currentTimeEl = document.getElementById('current-time');
            const durationEl = document.getElementById('duration');
            const playerTitle = document.getElementById('player-title');
            const playerSubtitle = document.getElementById('player-subtitle');

            // Global variables
            let audio = new Audio();
            let isPlaying = false;
            let currentSurah = null;
            let currentAyah = null;
            let currentQari = '01';
            let surahList = [];
            let filteredSurahList = [];
            let currentPlaylist = [];
            let currentTrackIndex = 0;

            // Qari options
            const qariOptions = {
                '01': 'Abdullah Al-Juhany',
                '02': 'Abdul-Muhsin Al-Qasim',
                '03': 'Abdurrahman as-Sudais',
                '04': 'Ibrahim Al-Dossari',
                '05': 'Misyari Rasyid Al-Afasi'
            };

            // Load surah list
            function loadSurahList() {
                showLoading();
                fetch('https://equran.id/api/v2/surat')
                    .then(response => response.json())
                    .then(data => {
                        if (data.code === 200) {
                            surahList = data.data;
                            filteredSurahList = [...surahList];
                            renderSurahList();
                        } else {
                            showError('Gagal memuat daftar surah');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showError('Terjadi kesalahan saat memuat data');
                    });
            }

            // Render surah list
            function renderSurahList() {
                if (filteredSurahList.length === 0) {
                    contentEl.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px;"></i>
                            <h3>Tidak ditemukan surah yang sesuai</h3>
                            <p>Coba kata kunci lain atau lihat daftar lengkap surah</p>
                            <button onclick="window.location.reload()" style="margin-top: 15px; background-color: var(--primary); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Muat Ulang</button>
                        </div>
                    `;
                    return;
                }

                contentEl.innerHTML = `
                    <h2 style="margin-bottom: 20px;">Daftar Surah</h2>
                    <div class="surah-list" id="surah-list">
                        ${filteredSurahList.map(surah => `
                            <div class="surah-card" onclick="loadSurahDetail(${surah.nomor})">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div class="surah-number">${surah.nomor}</div>
                                    <div style="font-family: 'Amiri', serif; font-size: 24px; margin: 15px;">${surah.nama}</div>
                                </div>
                                <div class="surah-content">
                                    <h3 class="surah-name-latin">${surah.namaLatin}</h3>
                                    <p style="margin-bottom: 10px;">${surah.arti}</p>
                                    <div class="surah-meta">
                                        <span>${surah.tempatTurun}</span>
                                        <span>${surah.jumlahAyat} ayat</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Load surah detail
            function loadSurahDetail(surahId) {
                showLoading();
                fetch(`https://equran.id/api/v2/surat/${surahId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.code === 200) {
                            currentSurah = data.data;
                            renderSurahDetail();
                        } else {
                            showError('Gagal memuat detail surah');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showError('Terjadi kesalahan saat memuat data');
                    });
            }

            // Render surah detail
            function renderSurahDetail() {
                contentEl.innerHTML = `
                    <button class="back-btn" onclick="loadSurahList()">
                        <i class="fas fa-arrow-left"></i> Kembali ke Daftar Surah
                    </button>
                    <div class="surah-detail">
                        <div class="surah-header">
                            <div class="surah-title">
                                <h1>${currentSurah.namaLatin} <span style="font-family: 'Amiri', serif;">(${currentSurah.nama})</span></h1>
                                <p>${currentSurah.tempatTurun} • ${currentSurah.jumlahAyat} ayat</p>
                            </div>
                            <div class="surah-number" style="margin: 0;">${currentSurah.nomor}</div>
                        </div>
                        <div class="surah-info">
                            <p><strong>Arti:</strong> ${currentSurah.arti}</p>
                            <p><strong>Deskripsi:</strong> ${currentSurah.deskripsi}</p>
                        </div>
                        <div class="qari-selector">
                            <label for="qari-select">Pilih Qari:</label>
                            <select id="qari-select" onchange="changeQari(this.value)">
                                ${Object.entries(qariOptions).map(([id, name]) => `
                                    <option value="${id}" ${id === currentQari ? 'selected' : ''}>${name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="ayah-list" id="ayah-list">
                            ${currentSurah.ayat.map(ayah => `
                                <div class="ayah-item" id="ayah-${ayah.nomorAyat}">
                                    <div style="display: flex; align-items: center; justify-content: flex-end;">
                                        <span class="ayah-number">${ayah.nomorAyat}</span>
                                    </div>
                                    <div class="ayah-arabic">${ayah.teksArab}</div>
                                    <div class="ayah-translation">
                                        <p><strong>Transliterasi:</strong> ${ayah.teksLatin}</p>
                                        <p><strong>Terjemahan:</strong> ${ayah.teksIndonesia}</p>
                                    </div>
                                    <div class="ayah-actions">
                                        <button onclick="playAyah(${currentSurah.nomor}, ${ayah.nomorAyat}, '${qariOptions[currentQari]}', event)">
                                            <i class="fas fa-play"></i> Dengarkan
                                        </button>
                                        <button onclick="addToPlaylist(${currentSurah.nomor}, ${ayah.nomorAyat}, '${qariOptions[currentQari]}', event)">
                                            <i class="fas fa-plus"></i> Tambah ke Playlist
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="nav-buttons">
                            ${currentSurah.suratSebelumnya ? `
                                <button class="nav-btn" onclick="loadSurahDetail(${currentSurah.suratSebelumnya.nomor})">
                                    <i class="fas fa-arrow-left"></i> ${currentSurah.suratSebelumnya.namaLatin}
                                </button>
                            ` : '<div></div>'}
                            ${currentSurah.suratSelanjutnya ? `
                                <button class="nav-btn" onclick="loadSurahDetail(${currentSurah.suratSelanjutnya.nomor})">
                                    ${currentSurah.suratSelanjutnya.namaLatin} <i class="fas fa-arrow-right"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;

                // Create playlist for this surah
                currentPlaylist = currentSurah.ayat.map(ayah => ({
                    surahId: currentSurah.nomor,
                    ayahNumber: ayah.nomorAyat,
                    qari: currentQari,
                    qariName: qariOptions[currentQari],
                    surahName: currentSurah.namaLatin,
                    audioUrl: ayah.audio[currentQari]
                }));
            }

            // Change Qari
            function changeQari(qariId) {
                currentQari = qariId;
                if (currentSurah) {
                    renderSurahDetail();
                }
            }

            // Play ayah
            function playAyah(surahId, ayahNumber, qariName, event) {
                if (event) event.stopPropagation();
                
                const ayah = currentSurah.ayat.find(a => a.nomorAyat === ayahNumber);
                if (!ayah) return;

                currentAyah = ayahNumber;
                const audioUrl = ayah.audio[currentQari];

                playerTitle.textContent = `${currentSurah.namaLatin} Ayat ${ayahNumber}`;
                playerSubtitle.textContent = `Qari: ${qariName}`;
                
                audio.src = audioUrl;
                audio.play()
                    .then(() => {
                        player.classList.add('active');
                        isPlaying = true;
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    })
                    .catch(error => {
                        console.error('Error playing audio:', error);
                        alert('Gagal memutar audio. Silakan coba lagi.');
                    });

                // Highlight current ayah
                document.querySelectorAll('.ayah-item').forEach(item => {
                    item.style.backgroundColor = 'transparent';
                });
                document.getElementById(`ayah-${ayahNumber}`).style.backgroundColor = 'rgba(44, 120, 108, 0.1)';

                // Set current track index
                currentTrackIndex = currentPlaylist.findIndex(item => item.ayahNumber === ayahNumber);
            }

            // Add to playlist
            function addToPlaylist(surahId, ayahNumber, qariName, event) {
                if (event) event.stopPropagation();
                
                const ayah = currentSurah.ayat.find(a => a.nomorAyat === ayahNumber);
                if (!ayah) return;

                const track = {
                    surahId,
                    ayahNumber,
                    qari: currentQari,
                    qariName,
                    surahName: currentSurah.namaLatin,
                    audioUrl: ayah.audio[currentQari]
                };

                currentPlaylist.push(track);
                alert(`Ayat ${ayahNumber} telah ditambahkan ke playlist`);
            }

            // Play next track
            function playNext() {
                if (currentPlaylist.length === 0) return;
                
                currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
                const track = currentPlaylist[currentTrackIndex];
                
                playerTitle.textContent = `${track.surahName} Ayat ${track.ayahNumber}`;
                playerSubtitle.textContent = `Qari: ${track.qariName}`;
                
                audio.src = track.audioUrl;
                audio.play()
                    .then(() => {
                        player.classList.add('active');
                        isPlaying = true;
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    })
                    .catch(error => {
                        console.error('Error playing audio:', error);
                    });

                // Scroll to the ayah if we're in the surah detail view
                if (currentSurah && currentSurah.nomor === track.surahId) {
                    const ayahEl = document.getElementById(`ayah-${track.ayahNumber}`);
                    if (ayahEl) {
                        ayahEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        ayahEl.style.backgroundColor = 'rgba(44, 120, 108, 0.1)';
                    }
                }
            }

            // Play previous track
            function playPrev() {
                if (currentPlaylist.length === 0) return;
                
                currentTrackIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
                const track = currentPlaylist[currentTrackIndex];
                
                playerTitle.textContent = `${track.surahName} Ayat ${track.ayahNumber}`;
                playerSubtitle.textContent = `Qari: ${track.qariName}`;
                
                audio.src = track.audioUrl;
                audio.play()
                    .then(() => {
                        player.classList.add('active');
                        isPlaying = true;
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    })
                    .catch(error => {
                        console.error('Error playing audio:', error);
                    });

                // Scroll to the ayah if we're in the surah detail view
                if (currentSurah && currentSurah.nomor === track.surahId) {
                    const ayahEl = document.getElementById(`ayah-${track.ayahNumber}`);
                    if (ayahEl) {
                        ayahEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        ayahEl.style.backgroundColor = 'rgba(44, 120, 108, 0.1)';
                    }
                }
            }

            // Toggle play/pause
            function togglePlay() {
                if (audio.src) {
                    if (isPlaying) {
                        audio.pause();
                        playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    } else {
                        audio.play()
                            .then(() => {
                                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                            })
                            .catch(error => {
                                console.error('Error playing audio:', error);
                            });
                    }
                    isPlaying = !isPlaying;
                }
            }

            // Update progress bar
            function updateProgress() {
                const { duration, currentTime } = audio;
                const progressPercent = (currentTime / duration) * 100;
                progress.style.width = `${progressPercent}%`;
                
                // Format time
                const durationMinutes = Math.floor(duration / 60);
                const durationSeconds = Math.floor(duration % 60);
                durationEl.textContent = `${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;
                
                const currentMinutes = Math.floor(currentTime / 60);
                const currentSeconds = Math.floor(currentTime % 60);
                currentTimeEl.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;
            }

            // Set progress when clicked
            function setProgress(e) {
                const width = this.clientWidth;
                const clickX = e.offsetX;
                const duration = audio.duration;
                audio.currentTime = (clickX / width) * duration;
            }

            // Show loading indicator
            function showLoading() {
                contentEl.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                    </div>
                `;
            }

            // Show error message
            function showError(message) {
                contentEl.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px; color: var(--primary);"></i>
                        <h3>${message}</h3>
                        <button onclick="window.location.reload()" style="margin-top: 15px; background-color: var(--primary); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Coba Lagi</button>
                    </div>
                `;
            }

            // Search surah
            function searchSurah() {
                const query = searchInput.value.toLowerCase();
                filteredSurahList = surahList.filter(surah => 
                    surah.namaLatin.toLowerCase().includes(query) || 
                    surah.arti.toLowerCase().includes(query) ||
                    surah.nomor.toString().includes(query)
                );
                renderSurahList();
            }

            // Event listeners
            searchBtn.addEventListener('click', searchSurah);
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    searchSurah();
                }
            });

            playBtn.addEventListener('click', togglePlay);
            prevBtn.addEventListener('click', playPrev);
            nextBtn.addEventListener('click', playNext);
            closePlayer.addEventListener('click', function() {
                player.classList.remove('active');
                audio.pause();
                isPlaying = false;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            });

            progressBar.addEventListener('click', setProgress);

            audio.addEventListener('timeupdate', updateProgress);
            audio.addEventListener('ended', playNext);
            audio.addEventListener('loadedmetadata', updateProgress);

            // Make functions available globally
            window.loadSurahList = loadSurahList;
            window.loadSurahDetail = loadSurahDetail;
            window.playAyah = playAyah;
            window.addToPlaylist = addToPlaylist;
            window.changeQari = changeQari;

            // Initialize
            loadSurahList();
        });
   