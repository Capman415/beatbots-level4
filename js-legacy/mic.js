window.MicCore = {
  ctx: null,
  stream: null,
  src: null,
  an: null,
  sink: null,
  buf: null,
  async start(raw = true, aec = false) {
    this.stop();
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC({ latencyHint: "interactive" });
    await this.ctx.resume();
    this.stream = await navigator.mediaDevices.getUserMedia(raw ? { audio: { echoCancellation: !!aec, noiseSuppression: false, autoGainControl: false } } : { audio: true });
    this.src = this.ctx.createMediaStreamSource(this.stream);
    this.an = this.ctx.createAnalyser();
    this.an.fftSize = 2048;
    this.an.smoothingTimeConstant = 0;
    this.src.connect(this.an);
    this.sink = this.ctx.createGain();
    this.sink.gain.value = 0;
    this.an.connect(this.sink);
    this.sink.connect(this.ctx.destination);
    this.buf = new Float32Array(this.an.fftSize);
    return this.stream;
  },
  stop() {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.ctx) this.ctx.close().catch(() => {
    });
    this.stream = this.ctx = this.an = null;
  },
  // full-buffer RMS + max, exactly like the test page
  read() {
    if (!this.an) return { rms: 0, max: 0 };
    const b = this.buf;
    this.an.getFloatTimeDomainData(b);
    let s = 0, mx = 0;
    for (const v of b) {
      s += v * v;
      const a = v < 0 ? -v : v;
      if (a > mx) mx = a;
    }
    return { rms: Math.sqrt(s / b.length), max: mx };
  },
  track() {
    return this.stream && this.stream.getAudioTracks()[0];
  }
};
