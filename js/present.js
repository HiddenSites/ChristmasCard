// --- Base folder for sound effects ---
const EFFECTS_FOLDER = 'Media/Audio/Effects/';

// --- Sound file constants ---
const SOUND_LID_OPEN = null; // no lid sound for now
const SOUND_PAPER_TEAR = `${EFFECTS_FOLDER}paper-torn.mp3`;

class Present {
  static totalUnlocked = 0;
  static presents = [];
  static allPresentsOpened = false;
  static bonusPresentSpawned = false;
  static FinalPresentSpawned = false;

  constructor({
    folder,
    locked = false,
    triggerItems = [],
    transitionState = TransitionState.NONE,
    style = 'classic-red',
    width = null,
    height = null,
    hasLid = false,
    hasRibbon = false,
    colorVariant = '',
    ribbonStyle = 'classic',
    x = null, y = null
  }) {

    // Force unlocked if all presents have been opened before
    if (Present.allPresentsOpened) {
      locked = false;
    }

    this.folder = folder;
    this.locked = locked;
    this.triggerItems = triggerItems;
    this.transitionState = transitionState;
    this.style = style;
    this.width = width;
    this.height = height;
    this.hasLid = hasLid;
    this.hasRibbon = hasRibbon;
    this.colorVariant = colorVariant;
    this.ribbonStyle = ribbonStyle;
    this.x = x;
    this.y = y;

    Present.presents.push(this);
    if (!locked) Present.totalUnlocked++;

    this.element = this.createElement();
    this.addListeners();
  }

  static showMessage(message, timeOut = 3000) {
    const existing = document.querySelector('.message-box');
    if (existing) existing.remove();

    const box = document.createElement('div');
    box.className = 'message-box';

    const text = document.createElement('p');
    text.textContent = message;

    const button = document.createElement('button');
    button.textContent = 'OK';
    button.onclick = () => box.remove();

    box.appendChild(text);
    box.appendChild(button);
    document.body.appendChild(box);

    setTimeout(() => {
      if (box.parentNode) box.remove();
    }, timeOut);
  }

  createElement() {
    const el = document.createElement('div');
    el.classList.add('present', this.style);
    el.dataset.folder = this.folder;
    el.dataset.locked = this.locked;

    if (this.x !== null && this.y !== null) {
      el.style.position = 'absolute';
      el.style.left = this.x;
      el.style.top = this.y;
    }

    if (this.hasLid) el.classList.add('has-lid');
    if (this.hasRibbon) el.classList.add('has-ribbon');
    if (this.colorVariant) el.classList.add(this.colorVariant);

    if (this.width) el.style.width = this.width;
    if (this.height) el.style.height = this.height;

    const box = document.createElement('div');
    box.classList.add('box');
    el.appendChild(box);

    if (this.hasLid) {
      const lid = document.createElement('div');
      lid.classList.add('lid');
      el.appendChild(lid);

      if (this.hasRibbon) {
        const ribbon = document.createElement('div');
        ribbon.classList.add('ribbon');
        ribbon.classList.add('ribbon-on-lid'); // ribbon moves with lid
        ribbon.classList.add(this.ribbonStyle);
        lid.appendChild(ribbon); // <-- append INSIDE lid
      }
    } else if (this.hasRibbon) {
      // ribbon on box
      const ribbon = document.createElement('div');
      ribbon.classList.add('ribbon', 'ribbon-on-box', this.ribbonStyle);
      el.appendChild(ribbon);
    }

    return el;
  }

  addListeners() {
    this.element.addEventListener('click', () => {
      if (this.locked) {
        if (Present.totalUnlocked > 0) {
          Present.showMessage("Save your best presents for last, open the other ones first!");
          return;
        } else {
          this.locked = false;
          this.element.dataset.locked = false;
        }
      }
      // Play the correct sound if it exists
      const soundFile = this.hasLid ? SOUND_LID_OPEN : SOUND_PAPER_TEAR;
      if (soundFile) new Audio(soundFile).play();

      if (this.hasLid) {
        // Trigger lid animation
        this.element.classList.add('opened');
      } 
      // Wait for CSS animation to finish before removing
      setTimeout(() => {
        this.finishOpening();
      }, 1000);
    });
  }

  finishOpening() {
    if (typeof Gallery !== 'undefined' && Gallery.open) {
      Gallery.open(this.folder, this.triggerItems, this.transitionState);
    }

    this.element.remove();
    Present.presents = Present.presents.filter(p => p !== this);

    if (this.locked) {
      this.locked = false;
      Present.totalUnlocked++;
    } else {
      Present.totalUnlocked--;
    }
  }

  render(container) {
    container.appendChild(this.element);
  }

  static checkAllOpened() {
    if (Present.totalUnlocked === 0 && !Present.bonusPresentSpawned) {
      Present.spawnBonus();
    }
    if (Present.presents.length === 0) {
      if (!Present.FinalPresentSpawned) {
        Present.spawnFinal();
        return false;
      }
      Present.showMessage("You've opened all the presents! Now go open your real ones... or open these again.");
      for (let i = 0; i < 100; i++){
        spawnSnow();
      }
      Present.allPresentsOpened = true;
      createAllPresents();
      return true;
    }
    else {
      return false;
    }
  }

  static spawnBonus() {

      Present.bonusPresentSpawned = true;

      const container = document.getElementById('presents-container');

      const bonus = new Present({
          x: '33%',
          y: '75%',
          width: '7rem',
          height: '6rem',
          folder: 'Bonus',
          style: 'bonus-gold',
          hasLid: true,
          hasRibbon: true,
          ribbonStyle: 'classic',
          transitionState: TransitionState.FULL,
          triggerItems: [{song:'Santa Baby.mp3'}]
      });

      // Add pop-in animation class
      bonus.element.classList.add('bonus-pop-in');

      // Render it
      bonus.render(container);

      // Optional: show a message
      Present.showMessage("Here's a bonus present!");
  }

  static spawnFinal() {

  const container = document.getElementById('presents-container');

  const bonus = new Present({
    x: '25%',
    y: '75%',
    width: '10rem',
    height: '3rem',
    folder: 'Final',
    style: 'final-gaming-glow',
    hasLid: true,
    hasRibbon: true,
    ribbonStyle: 'classic',
    transitionState: TransitionState.FULL,
    triggerItems: []
  });

  bonus.element.classList.add('bonus-pop-in');

  bonus.render(container);
  if (!Present.FinalPresentSpawned) {
    Present.FinalPresentSpawned = true;
    Present.showMessage("Here's a real present! What's in here is installed on our Xbox.");
  }
}

}

function createPresents() {
  const presentsContainer = document.getElementById('presents-container');

  const presents = [
    new Present({ x:'29%', y:'75%', width:'5rem', height:'5rem',
                  folder:'Bass', style:'candy-cane-stripes', hasLid:true, hasRibbon:true, ribbonStyle:'classic', transitionState:TransitionState.FIRST,
                  triggerItems:[{song:'Rudy the Red Nosed Reindeer.mp3'}] }),
                  
    new Present({ x:'63%', y:'78%', width:'6rem', height:'4rem',
                  folder:'Charlie', style:'charlie-stripes', hasLid:true, hasRibbon:true, ribbonStyle:'classic', transitionState:TransitionState.FIRST,
                  triggerItems:[{song:'A Charlie Brown Christmas.mp3'}] }),
                  
    new Present({ x:'60%', y:'63%', width:'7.5rem', height:'5.5rem',
                  folder:'Movies', style:'film-reel-clean', hasLid:true, hasRibbon:false, ribbonStyle:'classic', locked:true,
                  triggerItems:[{photo:'978E893A-17DE-40CB-8424-BEDDAC97DA70', song:'Mele Kalikimaka.mp3'},
                    {photo:'1C24FE35-F070-4D32-BE9B-A2D250ABFDB7', song:'Alvin and the Chipmunks.mp3'}
                  ] }),

    new Present({ x:'45%', y:'72%', width:'6.5rem', height:'5rem',
                  folder:'TV', style:'tv-set', hasLid:false, hasRibbon:false, ribbonStyle:'classic', locked:true,
                  }),
                  
    new Present({ x:'28%', y:'72%', width:'2.5rem', height:'3.5rem',
                  folder:'Games', style:'games-pixels', hasLid:false, hasRibbon:true, ribbonStyle:'classic', locked:true,
                  triggerItems:[] }),
                  
    new Present({ x:'0%', y:'72%', width:'6rem', height:'5rem',
                  folder:'Gremlin', style:'gremlin-splatter', hasLid:true, hasRibbon:true, ribbonStyle:'classic', transitionState:TransitionState.FIRST,
                  triggerItems:[] }),
                  
    new Present({ x:'5%', y:'45%', width:'3rem', height:'10.5rem',
                  folder:'Grinch', style:'grinch-fur', hasLid:false, hasRibbon:true, ribbonStyle:'classic', transitionState:TransitionState.FIRST,
                  triggerItems:[{song:'Welcome Christmas'}] }),
                  
    new Present({ x:'19%', y:'53%', width:'8.5rem', height:'9rem',
                  folder:'Muppets', style:'muppets-confetti', hasLid:false, hasRibbon:true, ribbonStyle:'classic', transitionState:TransitionState.FIRST,
                  triggerItems:[{song:'It Feels Like Christmas.mp3'}] })
  ];

  // First, render them in any order so they exist in the DOM
  presents.forEach(p => p.render(presentsContainer));

  // Now actually measure their visual bottom position
  presents.sort((a, b) => {
    const aRect = a.element.getBoundingClientRect();
    const bRect = b.element.getBoundingClientRect();

    const aBottom = aRect.bottom; // absolute bottom position in viewport
    const bBottom = bRect.bottom;

    return aBottom - bBottom; // lower bottoms come first, higher last
  });

  presentsContainer.querySelectorAll('.present').forEach(el => el.remove());
  presents.forEach(p => presentsContainer.appendChild(p.element));
}

function createAllPresents(){
  spawnBonus();
  spawnFinal();
  createPresents();
}