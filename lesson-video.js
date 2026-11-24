// MathPath · Autor: Abel Josué Colquehuanca Humpiri
class AbelLessonVideoPlayer {
  constructor(dialog) {
    this.dialog = dialog;
    this.title = dialog.querySelector('#lesson-video-title');
    this.stage = dialog.querySelector('[data-video-stage]');
    this.controls = dialog.querySelector('.video-controls');
    this.seek = dialog.querySelector('#video-seek');
    this.position = dialog.querySelector('[data-video-position]');
    this.previous = dialog.querySelector('[data-video-control="previous"]');
    this.next = dialog.querySelector('[data-video-control="next"]');
    this.playButton = dialog.querySelector('[data-video-control="play"]');
    this.narration = dialog.querySelector('.video-narration input');
    this.speech = window.speechSynthesis;
    this.frames = [];
    this.index = 0;
    this.request = 0;
    this.animation = 0;
    this.playing = false;
    this.finished = false;

    dialog.addEventListener('close', () => {
      this.request++;
      this.pause();
    });
    this.playButton.addEventListener('click', () => this.playing ? this.pause() : this.play());
    this.previous.addEventListener('click', () => this.show(this.index - 1));
    this.next.addEventListener('click', () => this.show(this.index + 1));
    this.seek.addEventListener('input', () => this.show(Number(this.seek.value)));
    this.narration.addEventListener('change', () => {
      if (this.playing) this.schedule();
    });
    this.speech?.addEventListener('voiceschanged', () => this.updateVoice());
  }

  updateVoice() {
    const spanish = this.speech?.getVoices().filter(voice => voice.localService && /^es(?:-|$)/i.test(voice.lang)) || [];
    this.voice = spanish.find(voice => voice.lang === 'es-PE') || spanish[0];
    this.narration.closest('label').hidden = !this.voice;
  }

  async open(title, loadFrames) {
    if (this.dialog.open) return;
    const request = ++this.request;
    this.title.textContent = title;
    this.stage.textContent = 'Preparando la minilección…';
    this.controls.hidden = true;
    this.updateVoice();
    this.dialog.showModal();
    try {
      const frames = await loadFrames();
      if (!this.dialog.open || request !== this.request) return;
      this.frames = frames;
      this.controls.hidden = false;
      this.seek.max = String(frames.length - 1);
      this.show(0);
      this.play();
    } catch {
      if (this.dialog.open && request === this.request) {
        this.stage.textContent = 'No se pudo cargar la minilección. Ciérrala y vuelve a abrirla.';
      }
    }
  }

  show(index) {
    this.index = Math.max(0, Math.min(index, this.frames.length - 1));
    this.finished = false;
    const frame = this.frames[this.index];
    this.stage.innerHTML = '<div class="video-frame"><h3></h3><div class="video-frame-math">' +
      frame.body + '</div></div>';
    this.stage.querySelector('h3').textContent = frame.title;
    this.position.textContent = (this.index + 1) + ' / ' + this.frames.length;
    this.seek.value = String(this.index);
    this.seek.setAttribute('aria-valuetext', frame.title + ', escena ' + (this.index + 1) + ' de ' + this.frames.length);
    this.previous.disabled = this.index === 0;
    this.next.disabled = this.index === this.frames.length - 1;
    this.playButton.textContent = this.playing ? 'Pausar' : 'Reproducir';
    if (this.playing) this.schedule();
  }

  play() {
    this.playing = true;
    if (this.finished) this.show(0);
    else this.schedule();
    this.playButton.textContent = 'Pausar';
  }

  cancelTimer() {
    this.animation++;
    clearTimeout(this.timer);
    if (this.utterance) {
      this.utterance = null;
      this.speech.cancel();
    }
  }

  pause() {
    this.playing = false;
    this.cancelTimer();
    this.playButton.textContent = this.finished ? 'Repetir' : 'Reproducir';
  }

  schedule() {
    this.cancelTimer();
    const animation = this.animation;
    const text = this.frames[this.index].narration;
    const duration = Math.max(5000, text.length * 62);
    const advance = () => {
      if (!this.playing || !this.dialog.open || this.animation !== animation) return;
      if (this.index === this.frames.length - 1) {
        this.finished = true;
        this.pause();
      } else this.show(this.index + 1);
    };
    this.timer = setTimeout(advance, duration);
    if (!this.narration.checked || !this.voice) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voice;
    utterance.lang = this.voice.lang;
    utterance.rate = 0.92;
    utterance.onstart = () => {
      if (this.animation !== animation) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(advance, duration * 2);
    };
    utterance.onend = () => {
      if (this.animation !== animation) return;
      this.utterance = null;
      clearTimeout(this.timer);
      this.timer = setTimeout(advance, 900);
    };
    this.utterance = utterance;
    this.speech.speak(utterance);
  }
}
