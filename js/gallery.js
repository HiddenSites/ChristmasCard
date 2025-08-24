class Gallery {
  static container = document.getElementById('gallery-container');
  static baseEncryptedFolder = 'Media/EncryptedPhotos'; // your root folder
  static currentFolder = null;
  static currentImages = []; // array of blob URLs or null placeholders for lazy load
  static currentIndex = 0;
  static autoTransition = false;
  static autoTransitionTimeoutId = null;
  static justOpened = true;
  // Configurable timing
  static fadeDuration = 3000; // ms, fade in/out speed
  static autoTransitionDelay = 3000; // ms, delay before auto transition to next image

  // Flags which loading mode to use
  static preloadAllImages = false;
  static isTransitioning = false;

  // New flag: whether to wrap around when swiping past first/last image
  static wrapAround = false; // false to disable looping

  static allPresentsOpened = false;

  static triggerItems = [];
  static imageIndexMap;

  static setButtonsVisibility(state) {
    const prevBtn = this.container.querySelector('button.prev');
    const nextBtn = this.container.querySelector('button.next');
    const closeBtn = this.container.querySelector('button.close');
    [prevBtn, nextBtn, closeBtn].forEach(btn => {
      if (btn) btn.style.visibility = state;
    });
  }

  static async open(folder, triggerItems = [], autoTransition = false, preloadAllImages = false, wrapAround) {
    this.currentFolder = `${this.baseEncryptedFolder}/${folder}`;
    this.currentIndex = 0;
    this.autoTransition = autoTransition;
    this.preloadAllImages = preloadAllImages;
    this.wrapAround = wrapAround;
    this.triggerItems = triggerItems;
    this.justOpened = true;

    if (this.allPresentsOpened){
      this.wrapAround = true;
      this.justOpened = false;
      this.autoTransition = false;
    }

    // Play first trigger song that does not have a photo
    if (triggerItems.length > 0) {
      const songWithoutPhoto = triggerItems.find(item => item.song && !item.photo);
      if (songWithoutPhoto) {
        AudioPlayer.getInstance().playSongByName(songWithoutPhoto.song);
      }
    }

    // Hide card
    cardSwipeEnabled = false;
    document.getElementById("card-wrapper").style.display = "none";

    this.container.style.display = "flex";

    // Setup buttons
    const prevBtn = this.container.querySelector('button.prev');
    const nextBtn = this.container.querySelector('button.next');
    const closeBtn = this.container.querySelector('button.close');
    if (prevBtn) prevBtn.onclick = () => {
      if (!this.isTransitioning) this.showImage(this.currentIndex - 1);
    };
    if (nextBtn) nextBtn.onclick = () => {
      if (!this.isTransitioning) this.showImage(this.currentIndex + 1);
    };
    if (closeBtn) closeBtn.onclick = () => {
      if (!this.isTransitioning) this.close();
    };

    // Setup swipe handlers for mobile
    this.setupSwipeHandlers();

    // Hide buttons initially, they'll be shown after image is loaded/faded
    this.setButtonsVisibility('hidden');

    if (this.preloadAllImages) {
      await this.loadAllImages(this.currentFolder);
      this.showImage(0);
    } else {
      await this.loadImageList(this.currentFolder);
      this.showImage(0);
    }

    // Auto transition first -> second image if enabled
    if (this.autoTransition && this.currentImages.length > 1) {
      this.isTransitioning = true;
      this.autoTransitionTimeoutId = setTimeout(() => {
        this.fadeToImage(1);
      }, this.autoTransitionDelay);
    } else {
      this.setButtonsVisibility('visible');
    }
  }

  static async loadAllImages(folder) {
    if (!riddleKey) {
      alert("Decryption key not available. Please enter a valid passphrase.");
      return;
    }
    const imagePaths = await fetchEncryptedList(`${folder}/index.json`, folder);
    if (!imagePaths.length) return;

    this.currentImages = [];
    for (const path of imagePaths) {
      try {
        const blob = await decryptImage(path, riddleKey);
        const url = URL.createObjectURL(blob);
        this.currentImages.push(url);
      } catch (err) {
        console.error(`❌ Failed to decrypt ${path}:`, err);
        this.currentImages.push(null);
      }
    }
  }

  static stripAllExtensions(filename) {
    // Remove folder path, keep only file basename
    const baseName = filename.split('/').pop();
    // Remove everything from the first dot (.) to the end
    const firstDotIndex = baseName.indexOf('.');
    if (firstDotIndex === -1) return baseName.toLowerCase();
    return baseName.slice(0, firstDotIndex).toLowerCase();
  }


  static async loadImageList(folder) {
    if (!riddleKey) {
      alert("Decryption key not available. Please enter a valid passphrase.");
      return;
    }
    const imagePaths = await fetchEncryptedList(`${folder}/index.json`, folder);
    if (!imagePaths.length) return;
    this.imagePaths = imagePaths;
    this.currentImages = new Array(imagePaths.length).fill(null);

    // Build map: base filename (no extension) → index
    this.imageIndexMap = {};
    imagePaths.forEach((path, idx) => {
        const name = this.stripAllExtensions(path);
        this.imageIndexMap[name] = idx;
    });
      console.log("Image Index Map built:", this.imageIndexMap);
  }

  static async loadImage(index) {
    if (this.currentImages[index]) return this.currentImages[index];
    try {
      const blob = await decryptImage(this.imagePaths[index], riddleKey);
      const url = URL.createObjectURL(blob);
      this.currentImages[index] = url;
      return url;
    } catch (err) {
      console.error(`❌ Failed to decrypt image at index ${index}:`, err);
      return null;
    }
  }

  static async showImage(index) {
    // Handle wrapAround flag:
    if (index < 0) {
      if (this.wrapAround && !this.justOpened) index = this.currentImages.length - 1;
      else return; // stop at first image
    }
    if (index >= this.currentImages.length) {
      this.justOpened = false;
      if (this.wrapAround) index = 0;
      else this.close(); // stop at last image
    }
    this.currentIndex = index;
    console.log(`Showing image index: ${index}`);

    // Check for matching trigger items
    if (this.triggerItems && this.imageIndexMap) {
      for (const item of this.triggerItems) {
        if (!item.photo) continue; // skip if no photo
        const triggerPhotoName = this.stripAllExtensions(item.photo);
        const mappedIndex = this.imageIndexMap[triggerPhotoName];
        if (mappedIndex === index && item.song) {
          AudioPlayer.getInstance().playSongByName(item.song);
          break; // only play the first matching song
        }
      }
    }

    if (this.autoTransitionTimeoutId) {
      clearTimeout(this.autoTransitionTimeoutId);
      this.autoTransitionTimeoutId = null;
    }

    // Remove any existing images before showing new one
    const oldImgs = this.container.querySelectorAll('img');
    oldImgs.forEach(img => img.remove());

    let imgSrc = this.currentImages[index];
    if (!imgSrc) imgSrc = await this.loadImage(index);
    if (!imgSrc) {
      console.warn(`Image at index ${index} not available.`);
      return;
    }

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = `Image ${index + 1}`;
    this.container.insertBefore(img, this.container.firstChild);

    img.onload = () => console.log(`Image ${index + 1} loaded.`);

    this.preloadNextImage(index);
  }

  static async preloadNextImage(index) {
    //code to preload next image
    const nextIndex = (index + 1) % this.currentImages.length;
    if (!this.currentImages[nextIndex]) {
      this.loadImage(nextIndex).then(() => {
        console.log(`Preloaded image ${nextIndex + 1}`);
      }).catch(() => {
        console.warn(`Failed to preload image ${nextIndex + 1}`);
      });
    }
  }

  static fadeToImage(index) {
    // Remove any existing transitioning images besides the visible one
    const existingTransitionImgs = this.container.querySelectorAll('img.transitioning');
    existingTransitionImgs.forEach(img => img.remove());

    const oldImg = this.container.querySelector('img:not(.transitioning)');

    const newImg = document.createElement('img');
    newImg.classList.add('transitioning'); // mark as transition image
    Object.assign(newImg.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      opacity: '0',
      transition: `opacity ${this.fadeDuration}ms ease`,
    });
    newImg.alt = `Image ${index + 1}`;
    this.container.appendChild(newImg);

    (async () => {
      let imgSrc = this.currentImages[index];
      if (!imgSrc) imgSrc = await this.loadImage(index);
      if (!imgSrc) {
        this.isTransitioning = false;
        this.setButtonsVisibility('visible');
        newImg.remove();
        return;
      }

      newImg.src = imgSrc;

      // Force a fade even if image loads instantly:
      newImg.onload = () => {
        requestAnimationFrame(() => {
          newImg.style.opacity = '1';
        });

        if (oldImg) {
          oldImg.style.transition = `opacity ${this.fadeDuration}ms ease`;
          oldImg.style.opacity = '0';
        }

        setTimeout(() => {
          if (oldImg && oldImg.parentNode) oldImg.remove();

          // Remove the transitioning class, so newImg becomes the only visible one
          newImg.classList.remove('transitioning');

          this.isTransitioning = false;
          this.setButtonsVisibility('visible');

          this.preloadNextImage(index);
        }, this.fadeDuration);
      };

      newImg.onerror = () => {
        this.isTransitioning = false;
        this.setButtonsVisibility('visible');
        newImg.remove();
      };
    })();

    this.currentIndex = index;
  }

  static close() {
    this.setButtonsVisibility('hidden');

    this.container.style.display = "none";

    // Remove all images inside the container
    const imgs = this.container.querySelectorAll('img');
    imgs.forEach(img => {
      if (img.src) URL.revokeObjectURL(img.src); // revoke URL safely if needed
      img.remove();
    });

    // Clear image URLs array
    this.currentImages = [];
    this.imagePaths = [];
    this.currentFolder = null;
    this.currentIndex = 0;
    this.autoTransition = false;
    this.isTransitioning = false;

    cardSwipeEnabled = true;
    document.getElementById("card-wrapper").style.display = "flex";

    // Check if all presents have been opened:
    this.allPresentsOpened = Present.checkAllOpened()
  }

  static setupSwipeHandlers() {
    if (this.touchHandlerSetup) return;
    this.touchHandlerSetup = true;

    let startX = 0, startY = 0, isMoving = false;

    this.container.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isMoving = true;
    }, { passive: true });

    this.container.addEventListener('touchend', e => {
      if (!isMoving) return;
      isMoving = false;
      let dx = e.changedTouches[0].clientX - startX;
      let dy = e.changedTouches[0].clientY - startY;
      if (!this.isTransitioning && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        if (dx > 0) this.showImage(this.currentIndex - 1);
        else this.showImage(this.currentIndex + 1);
      }
    }, { passive: true });
  }
}
