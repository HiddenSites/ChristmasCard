const CHARLIMIT = 25;
lockInsert = false;

class AudioPlayer {
  constructor(audioSelector, nextBtnSelector, dropdownSelector, playlistUrl, basePath, hiddenSongs = [], firstSongs = null) {
    if (AudioPlayer._instance) {
      return AudioPlayer._instance;
    }

    this.audio = document.querySelector(audioSelector);
    this.nextBtn = document.querySelector(nextBtnSelector);
    this.dropdown = document.querySelector(dropdownSelector);
    this.playlistUrl = playlistUrl;
    this.basePath = basePath;
    this.playlist = [];
    this.songMap = {};
    this.currentIndex = 0;
    this.hiddenSongs = hiddenSongs.map(name => name.replace(/\.mp3$/i, "")); // normalize hidden songs
    this.firstSongs = (firstSongs || []).map(name => name.replace(/\.mp3$/i, "")); // normalize first songs

    this.init();

    AudioPlayer._instance = this;
  }

  async init() {
    try {
      const response = await fetch(this.playlistUrl);
      if (!response.ok) throw new Error("Failed to load playlist");
      this.playlist = await response.json();

      this.applyShuffleExcludingHidden();

      this.buildSongMap();
      this.populateDropdown();
      this.bindEvents();

      // --- PRELOAD FIRST SONG ---
      if (this.playlist.length > 0) {
        const firstSong = this.playlist[0];
        this.audio.src = `${this.basePath}/${firstSong}`;
         const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => this.audio.pause())
            .catch(err => console.warn("Initial autoplay blocked:", err));
        }
      }
    } catch (err) {
      console.error("Error initializing audio player:", err);
    }
  }

  // Shuffle playlist while excluding hidden songs completely
  applyShuffleExcludingHidden() {
    // Exclude hidden songs
    this.playlist = this.playlist.filter(
      song => !this.hiddenSongs.includes(song.replace(/\.mp3$/i, ""))
    );

    // Separate first songs (if any) from the rest
    let firstSongsToPlay = [];
    if (this.firstSongs && this.firstSongs.length > 0) {
      this.playlist = this.playlist.filter(song => {
        const normalized = song.replace(/\.mp3$/i, "");
        if (this.firstSongs.includes(normalized)) {
          firstSongsToPlay.push(song);
          return false; // remove from main playlist
        }
        return true;
      });

      // Shuffle first songs among themselves
      for (let i = firstSongsToPlay.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [firstSongsToPlay[i], firstSongsToPlay[j]] = [firstSongsToPlay[j], firstSongsToPlay[i]];
      }
    }

    // Shuffle the remaining playlist
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }

    // Prepend first songs (if any)
    this.playlist = [...firstSongsToPlay, ...this.playlist];
  }

  buildSongMap() {
    this.songMap = {};
    this.playlist.forEach((filename, index) => {
      const name = filename.replace(/\.mp3$/i, "");
      this.songMap[name] = index;
    });
  }

  populateDropdown() {
    this.dropdown.innerHTML = "";

    this.playlist.forEach((filename, index) => {
      const name = filename.replace(/\.mp3$/i, "");

      const option = document.createElement("option");
      option.value = index;
      option.textContent = name; // Use full name
      option.title = name;       // Tooltip for full name
      this.dropdown.appendChild(option);
    });
  }

  bindEvents() {
    this.nextBtn.addEventListener("click", () => {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      this.playSong(this.currentIndex);
    });

    this.dropdown.addEventListener("change", (e) => {
      const selectedIndex = parseInt(e.target.value);
      if (!isNaN(selectedIndex)) {
        this.currentIndex = selectedIndex;
        this.playSong(this.currentIndex);
      }
    });

    this.audio.addEventListener("ended", () => {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      this.playSong(this.currentIndex);
    });
  }

  playSong(index) {
    const filename = this.playlist[index];
    this.audio.src = `${this.basePath}/${filename}`;
    this.dropdown.value = index;

    console.log("🎵 Playing song:", filename);
    console.log("📜 Current playlist:", this.playlist);

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn("Autoplay blocked, attempting resume:", err);
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume().then(() => this.audio.play());
      });
    }
  }

  playSongByName(name, addToDropdown = true) {
    const key = name.replace(/\.mp3$/i, "");

    // If already in songMap
    if (key in this.songMap) {
      this.currentIndex = this.songMap[key];
      console.log("▶️ Hidden song already in playlist, playing:", name);
      this.playSong(this.currentIndex);
      return;
    }

    // Check hidden songs
    const hiddenIndex = this.hiddenSongs.findIndex(f => f === key);
    if (hiddenIndex === -1) {
      console.warn(`Song "${name}" not found.`);
      return;
    }

    const filename = this.hiddenSongs[hiddenIndex] + ".mp3";

    // 1. INSERT hidden song AFTER the current one
    const insertIndex = this.currentIndex + 1;
    this.playlist.splice(insertIndex, 0, filename);

    console.log("➕ Inserted hidden song:", filename, "at index", insertIndex);
    console.log("📜 Playlist after insertion:", this.playlist);

    // 2. REBUILD songMap from scratch
    this.buildSongMap();

    // 3. Rebuild dropdown so UI matches playlist exactly
    if (addToDropdown) {
      this.populateDropdown();
      this.dropdown.value = insertIndex;
    }

    // 4. Play the newly inserted track
    this.currentIndex = insertIndex;
    this.playSong(this.currentIndex);
  }

  play() {
    if (this.audio && this.audio.paused) {
      this.audio.play().catch(err => console.error("Audio play error:", err));
    }
  }

  pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  togglePlayPause() {
    if (!this.audio) return;
    if (this.audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  static getInstance(...args) {
    if (!AudioPlayer._instance) {
      AudioPlayer._instance = new AudioPlayer(...args);
    }
    return AudioPlayer._instance;
  }
}