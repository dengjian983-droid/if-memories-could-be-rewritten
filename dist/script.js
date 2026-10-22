const storyApp = document.querySelector('#story-app');
const sceneImage = document.querySelector('#scene-image');
const sceneTitle = document.querySelector('#scene-title');
const sceneCopy = document.querySelector('#scene-copy');
const choiceLabel = document.querySelector('#choice-label');
const choiceArea = document.querySelector('#choice-area');
const sceneStatus = document.querySelector('#scene-status');
const continueButton = document.querySelector('#continue-button');
const openingScreen = document.querySelector('#opening-screen');
const storyScreen = document.querySelector('#story-screen');
const endingScreen = document.querySelector('#ending-screen');
const memoryInterface = document.querySelector('#memory-interface');
const interfaceStatus = document.querySelector('#interface-status');
const objectHotspots = [...document.querySelectorAll('.object-hotspot')];
const startButton = document.querySelector('#start-button');
const openingStatus = document.querySelector('#opening-status');
const memoryLight = document.querySelector('#memory-light');
const transitionOverlay = document.querySelector('#transition-overlay');
const audioTracks = {
  childhoodKitchen: { audio: new Audio('assets/audio/scene-01-kitchen-web.wav'), loop: true, volume: 0.08 },
  childhoodWater: { audio: new Audio('assets/audio/scene-01-water-bubbles-web.wav'), loop: true, volume: 0.035 },
  middlePhoneRing: { audio: new Audio('assets/audio/scene-02-phone-ring-web.wav'), loop: false, volume: 0.14 },
  highSchoolMoney: { audio: new Audio('assets/audio/scene-03-money-bill-web.wav'), loop: false, volume: 0.13 },
  universityAir: { audio: new Audio('assets/audio/scene-04-air-conditioner-web.wav'), loop: true, volume: 0.055 },
  universityVibrate: { audio: new Audio('assets/audio/scene-04-phone-vibrate-web.wav'), loop: false, volume: 0.28 },
  hospitalAmbience: { audio: new Audio('assets/audio/hospital-air-conditioner-level-three-web.wav'), loop: true, volume: 0.28 }
};

const audioTracksByScene = {
  0: [audioTracks.childhoodKitchen, audioTracks.childhoodWater],
  1: [audioTracks.middlePhoneRing],
  2: [audioTracks.highSchoolMoney],
  3: [audioTracks.universityAir, audioTracks.universityVibrate],
  4: [audioTracks.hospitalAmbience]
};

Object.values(audioTracks).forEach((track) => {
  track.audio.loop = track.loop;
  track.audio.preload = 'auto';
  track.audio.volume = 0;
});

const scenes = [
  {
    title: 'Childhood',
    image: 'assets/scene-01-childhood-bedroom.png',
    paragraphs: [
      '6:03 a.m. The kettle is already boiling.',
      'Grandma asks whether I want noodles.'
    ],
    choices: [
      { label: 'Yes. I will eat with you.', type: 'present' },
      { label: 'It is too early. I do not want any.', type: 'historical' }
    ]
  },
  {
    title: 'Middle school',
    image: 'assets/scene-02-burn-injury.png',
    paragraphs: [
      'My leg is red and swollen. Dad answers the phone.',
      'Grandma asks how he could be so careless.'
    ],
    choices: [
      { label: 'Tell Grandma I am okay. Thank her for worrying about me.', type: 'present' },
      { label: 'Say nothing.', type: 'historical' }
    ]
  },
  {
    title: 'High school',
    image: 'assets/scene-03-grandmothers-sofa.png',
    paragraphs: [
      'A folded note is pressed into my palm.',
      'Grandma says, “Keep it.”'
    ],
    choices: [
      { label: 'Stay and talk with Grandma.', type: 'present' },
      { label: 'I have to go.', type: 'historical' }
    ]
  },
  {
    title: 'University',
    image: 'assets/scene-04-university-dorm.png',
    paragraphs: [
      'Mum is calling. She tells me that Grandma says I should try dating.',
      'She wants to see me graduate. She hopes she can still be there on my wedding day.'
    ],
    revealLines: [
      'Mum is calling.',
      'Grandma says you should try dating.',
      'She wants to see you graduate.',
      'She hopes she can still be there on your wedding day.'
    ]
  },
  {
    title: 'Hospital present',
    image: 'assets/scene-05-hospital-present.png',
    intro: [
      'Grandma is lying in a hospital bed.',
      'She cannot hear me clearly. She cannot remember who I am. She cannot say more than a small sound.'
    ],
    revealLines: [
      'Grandma, it is me.',
      'Can you hear me?',
      'Grandma: “Mm.”',
      'I should have thanked you earlier.',
      'Grandma: “Mm.”',
      'I do not know whether you can hear me now.',
      'Grandma: “Mm.”'
    ]
  }
];

const sceneImageCache = new Map();

function preloadSceneImages() {
  scenes.forEach((scene) => {
    if (sceneImageCache.has(scene.image)) return;
    const image = new Image();
    image.decoding = 'async';
    image.src = scene.image;
    sceneImageCache.set(scene.image, image);
  });
}

preloadSceneImages();

let currentScene = 0;
let revealedLines = 0;
let hasMoved = false;
let unlockedObject = 0;
let transitionInProgress = false;
const audioFadeFrames = new Map();
const audioStopTimers = new Map();

function fadeAudio(track, targetVolume, duration) {
  const existingFrame = audioFadeFrames.get(track);
  if (existingFrame !== undefined) {
    window.cancelAnimationFrame(existingFrame);
  }

  const startingVolume = track.audio.volume;
  const startedAt = window.performance.now();

  const step = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    track.audio.volume = startingVolume + ((targetVolume - startingVolume) * progress);
    if (progress < 1) {
      audioFadeFrames.set(track, window.requestAnimationFrame(step));
    } else {
      audioFadeFrames.delete(track);
    }
  };

  audioFadeFrames.set(track, window.requestAnimationFrame(step));
}

function startAudio(track) {
  window.clearTimeout(audioStopTimers.get(track));
  track.audio.currentTime = 0;
  track.audio.volume = 0;
  const playback = track.audio.play();
  if (playback) playback.catch(() => {});
  fadeAudio(track, track.volume, 1100);
}

function stopAudio(track) {
  fadeAudio(track, 0, 700);
  const stopTimer = window.setTimeout(() => {
    track.audio.pause();
    track.audio.currentTime = 0;
    audioStopTimers.delete(track);
  }, 760);
  audioStopTimers.set(track, stopTimer);
}

function stopAllAudio() {
  Object.values(audioTracks).forEach(stopAudio);
}

function startSceneAudio(sceneIndex) {
  stopAllAudio();
  const tracks = audioTracksByScene[sceneIndex] || [];
  tracks.forEach(startAudio);

  if (sceneIndex === 4) {
    window.setTimeout(() => {
      const hospitalTrack = audioTracks.hospitalAmbience;
      if (currentScene !== 4 || storyScreen.classList.contains('is-hidden') || !hospitalTrack.audio.paused) return;
      startAudio(hospitalTrack);
    }, 180);
  }
}

function primeSceneAudio(sceneIndex) {
  (audioTracksByScene[sceneIndex] || []).forEach((track) => {
    window.clearTimeout(audioStopTimers.get(track));
    track.audio.volume = 0;
    const playback = track.audio.play();
    if (playback) playback.catch(() => {});
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function transitionTo(action, { desaturate = false } = {}) {
  if (transitionInProgress) return;
  transitionInProgress = true;
  storyApp.classList.add('is-transitioning');
  storyApp.setAttribute('aria-busy', 'true');

  if (desaturate) {
    storyScreen.classList.add('is-historical');
    await wait(900);
  }

  transitionOverlay.classList.add('is-active');
  await wait(900);
  action();
  await wait(80);
  transitionOverlay.classList.remove('is-active');
  await wait(300);
  transitionInProgress = false;
  storyApp.classList.remove('is-transitioning');
  storyApp.setAttribute('aria-busy', 'false');
}

function setScreen(screen) {
  openingScreen.classList.toggle('is-hidden', screen !== 'opening');
  memoryInterface.classList.toggle('is-hidden', screen !== 'interface');
  storyScreen.classList.toggle('is-hidden', screen !== 'story');
  endingScreen.classList.toggle('is-hidden', screen !== 'ending');

  if (screen === 'story') {
    startSceneAudio(currentScene);
  } else {
    stopAllAudio();
  }
}

function updateInterface() {
  objectHotspots.forEach((button, index) => {
    const isUnlocked = index === unlockedObject;
    button.disabled = !isUnlocked;
    button.classList.remove('is-selecting');
    button.classList.toggle('is-unlocked', isUnlocked);
    button.classList.toggle('is-locked', !isUnlocked);
  });

  if (unlockedObject < objectHotspots.length) {
    interfaceStatus.textContent = unlockedObject === 0
      ? 'Move across the objects and choose the one that is waiting.'
      : '';
  } else {
    interfaceStatus.textContent = 'The objects are complete. The memory returns to the present.';
  }
}

function showMemoryInterface() {
  setScreen('interface');
  updateInterface();
}

function setSceneImage(scene) {
  sceneImage.style.backgroundImage = `url("${scene.image}")`;
  sceneImage.setAttribute('aria-label', `${scene.title} memory scene`);
}

function clearScene() {
  sceneCopy.innerHTML = '';
  choiceLabel.classList.add('is-hidden');
  choiceArea.innerHTML = '';
  sceneStatus.textContent = '';
  sceneStatus.classList.remove('status-pulse');
  storyScreen.classList.remove('shake');
  continueButton.classList.add('is-hidden');
  continueButton.textContent = 'Continue';
  revealedLines = 0;
}

function showParagraphs(scene) {
  scene.paragraphs.forEach((paragraph) => {
    const element = document.createElement('p');
    element.textContent = paragraph;
    sceneCopy.append(element);
  });
}

function showChoices(scene) {
  choiceLabel.classList.remove('is-hidden');
  scene.choices.forEach((choice) => {
    const button = document.createElement('button');
    button.className = 'choice-button';
    button.type = 'button';
    button.textContent = choice.label;
    button.addEventListener('click', () => handleChoice(choice.type));
    choiceArea.append(button);
  });
}

function showRevealButton(scene) {
  continueButton.classList.remove('is-hidden');
  continueButton.textContent = revealedLines < scene.revealLines.length ? 'Reveal the next line' : 'Continue';
  continueButton.onclick = () => {
    if (revealedLines < scene.revealLines.length) {
      const line = document.createElement('p');
      line.className = 'reveal-line';
      line.textContent = scene.revealLines[revealedLines];
      sceneCopy.append(line);
      revealedLines += 1;
      continueButton.textContent = revealedLines < scene.revealLines.length ? 'Reveal the next line' : 'Continue';
      if (revealedLines === scene.revealLines.length) {
        sceneStatus.textContent = '';
      }
      return;
    }
    advanceScene();
  };
}

function showScene(index) {
  currentScene = index;
  const scene = scenes[index];
  storyScreen.classList.remove('is-historical');
  clearScene();
  setSceneImage(scene);
  sceneTitle.textContent = scene.title;
  setScreen('story');

  if (scene.revealLines) {
    if (scene.intro) {
      sceneCopy.innerHTML = '';
      scene.intro.forEach((paragraph) => {
        const element = document.createElement('p');
        element.textContent = paragraph;
        sceneCopy.append(element);
      });
    }
    showRevealButton(scene);
  } else {
    showParagraphs(scene);
    showChoices(scene);
  }
}

function handleChoice(type) {
  if (type === 'present') {
    sceneStatus.textContent = 'That is not what happened.';
    sceneStatus.classList.remove('status-pulse');
    storyScreen.classList.remove('shake');
    window.setTimeout(() => {
      storyScreen.classList.add('shake');
      sceneStatus.classList.add('status-pulse');
    }, 10);
    return;
  }

  choiceLabel.classList.add('is-hidden');
  choiceArea.innerHTML = '';
  storyScreen.classList.add('is-historical');
  sceneStatus.textContent = '';
  continueButton.classList.remove('is-hidden');
  continueButton.textContent = 'Continue';
  continueButton.onclick = advanceScene;
}

function advanceScene() {
  const leaveHistoricalScene = storyScreen.classList.contains('is-historical');
  if (currentScene === 3) {
    primeSceneAudio(4);
  }

  transitionTo(() => {
    if (currentScene < 3) {
      unlockedObject = currentScene + 1;
      showMemoryInterface();
    } else if (currentScene === 3) {
      unlockedObject = objectHotspots.length;
      showScene(4);
    } else {
      setScreen('ending');
    }
  }, { desaturate: leaveHistoricalScene });
}

objectHotspots.forEach((button) => {
  button.addEventListener('click', () => {
    const objectIndex = Number(button.dataset.object);
    if (objectIndex !== unlockedObject) return;
    objectHotspots.forEach((hotspot) => hotspot.classList.remove('is-selecting'));
    button.classList.add('is-selecting');
    primeSceneAudio(objectIndex);
    transitionTo(() => showScene(objectIndex));
  });
});

function activateOpening(event) {
  const point = event.touches?.[0] || event;
  if (point.clientX !== undefined && point.clientY !== undefined) {
    memoryLight.style.left = `${point.clientX}px`;
    memoryLight.style.top = `${point.clientY}px`;
  }

  if (!hasMoved) {
    hasMoved = true;
    startButton.disabled = false;
    openingStatus.textContent = 'The memory is waiting.';
  }
}

window.addEventListener('pointermove', activateOpening);
window.addEventListener('pointerdown', activateOpening);
window.addEventListener('touchstart', activateOpening, { passive: true });

startButton.addEventListener('click', () => {
  startButton.disabled = true;
  primeSceneAudio(0);
  transitionTo(showMemoryInterface);
});

setScreen('opening');
