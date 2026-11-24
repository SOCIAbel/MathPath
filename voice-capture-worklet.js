// MathPath · Autor: Abel Josué Colquehuanca Humpiri
/* global AudioWorkletProcessor, registerProcessor, sampleRate */
"use strict";

const VOICE_SAMPLE_RATE = 16000;
const VOICE_CHUNK_SAMPLES = 4000;
const VOICE_MAX_GAIN = 4;
const VOICE_GAIN_FLOOR = 0.0015;
const VOICE_TARGET_RMS = 0.035;

class AbelVoiceCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.active = true;
    this.sourceRate = sampleRate;
    this.chunk = new Float32Array(VOICE_CHUNK_SAMPLES);
    this.chunkLength = 0;
    this.chunkEnergy = 0;
    this.chunkPeak = 0;
    this.resampleWeight = 0;
    this.resampleSum = 0;
    this.resampleEnergy = 0;
    this.resamplePeak = 0;

    this.port.onmessage = (event) => {
      const type = event.data && event.data.type;
      if (type !== "stop" && type !== "cancel") return;

      this.active = false;
      if (type === "stop") {
        // Keep the last, partially filled output sample when capture ends.
        if (this.resampleWeight > 0) this.finishResample();
        this.flushChunk();
      }
      this.clearPending();
      this.port.postMessage({ type: "stopped" });
    };
  }

  clearPending() {
    this.chunkLength = 0;
    this.chunkEnergy = 0;
    this.chunkPeak = 0;
    this.resampleWeight = 0;
    this.resampleSum = 0;
    this.resampleEnergy = 0;
    this.resamplePeak = 0;
  }

  appendSample(value, energy, peak) {
    this.chunk[this.chunkLength++] = value;
    this.chunkEnergy += energy;
    this.chunkPeak = Math.max(this.chunkPeak, peak);
    if (this.chunkLength === VOICE_CHUNK_SAMPLES) this.flushChunk();
  }

  finishResample() {
    const weight = this.resampleWeight;
    this.appendSample(
      this.resampleSum / weight,
      this.resampleEnergy / weight,
      this.resamplePeak,
    );
    this.resampleWeight = 0;
    this.resampleSum = 0;
    this.resampleEnergy = 0;
    this.resamplePeak = 0;
  }

  captureSample(value) {
    const sample = Number.isFinite(value) ? value : 0;
    const energy = sample * sample;
    const peak = Math.abs(sample);
    if (this.sourceRate === VOICE_SAMPLE_RATE) {
      this.appendSample(sample, energy, peak);
      return;
    }

    // Integrate each input frame across output-frame boundaries. Keeping the
    // fractional bucket between process calls avoids drift at 44.1 kHz and
    // accounts for every input frame, including the final partial bucket.
    let remaining = VOICE_SAMPLE_RATE;
    while (remaining > 0) {
      const weight = Math.min(remaining, this.sourceRate - this.resampleWeight);
      this.resampleSum += sample * weight;
      this.resampleEnergy += energy * weight;
      this.resamplePeak = Math.max(this.resamplePeak, peak);
      this.resampleWeight += weight;
      remaining -= weight;
      if (this.resampleWeight >= this.sourceRate) this.finishResample();
    }
  }

  flushChunk() {
    if (this.chunkLength === 0) return;

    // Metering uses the original input energy and peak, before gain or PCM
    // clipping. Do not boost silence or the very quiet microphone noise floor.
    const level = Math.min(1, Math.sqrt(this.chunkEnergy / this.chunkLength));
    const peak = Math.min(1, this.chunkPeak);
    let gain = level >= VOICE_GAIN_FLOOR
      ? Math.min(VOICE_MAX_GAIN, Math.max(1, VOICE_TARGET_RMS / level))
      : 1;
    if (peak > 0) gain = Math.min(gain, Math.max(1, 0.98 / peak));

    const pcm = new ArrayBuffer(this.chunkLength * 2);
    const view = new DataView(pcm);
    for (let index = 0; index < this.chunkLength; index += 1) {
      const value = Math.max(-1, Math.min(1, this.chunk[index] * gain));
      view.setInt16(
        index * 2,
        Math.round(value * (value < 0 ? 32768 : 32767)),
        true,
      );
    }
    this.port.postMessage({ type: "chunk", pcm, level, peak }, [pcm]);
    this.chunkLength = 0;
    this.chunkEnergy = 0;
    this.chunkPeak = 0;
  }

  process(inputs, outputs) {
    // The node may be connected to the destination to keep processing alive;
    // never send the microphone back to the speakers.
    for (const output of outputs) {
      for (const channel of output) channel.fill(0);
    }

    const input = inputs[0] && inputs[0][0];
    if (this.active && input) {
      for (let index = 0; index < input.length; index += 1) {
        this.captureSample(input[index]);
      }
    }
    return true;
  }
}

registerProcessor("mathpath-voice-capture", AbelVoiceCapture);
