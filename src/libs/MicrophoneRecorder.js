export default class MicrophoneRecorder {
    constructor(onStart, onStop, onData, options, audioContext) {
        
        this.audioCtx = audioContext.getAudioContext();
        this.analyser = audioContext.getAnalyser();
        this.stream = null;
        this.onStartCb = onStart;
        this.onStopCb = onStop;
        this.onStartMic = null;
        this.mediaOptions = options;
        this.onData = onData;
        this.chunks = [];
        this.startTime = null;
    }
    
    startMic(constraintOpts = {}) {
        if (this.stream) {
            return Promise.resolve();
        }

        if (navigator.mediaDevices) {
            const constraints = {
                audio: true,
                ...constraintOpts,
                video: false
            };
            return navigator.mediaDevices.getUserMedia(constraints).then(str => {
                if (this.stream) {
                    // someone called startMic again before it resolved
                    // so cancel the original call
                    this.stream.getTracks().forEach(track => track.stop());
                }

                const source = this.audioCtx.createMediaStreamSource(this.stream);
                source.connect(this.analyser);

                if (this.audioCtx && this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }

                if (this.onStartMic) {
                    this.onStartMic(str);
                }

                return str;

            });
        }

        return Promise.reject(new Error('Your browser does not support audio recording'))
    }

    startRecording(constraintOpts) {
        this.startMic(constraintOpts).then(() => {
            this.startTime = Date.now();

            if (!this.mediaRecorder) {
                if (MediaRecorder.isTypeSupported(this.mediaOptions.mimeType)) {
                    this.mediaRecorder = new MediaRecorder(this.stream, this.mediaOptions);
                } else {
                    this.mediaRecorder = new MediaRecorder(this.stream);
                }

                this.mediaRecorder.addEventListener('stop', () => this.onStop());
                this.mediaRecorder.addEventListener('dataavailable', e => {
                    this.chunks.push(e.data);
                    if (this.onData) {
                        this.onData(e.data);
                    }
                });
            }
                    
            if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
                this.mediaRecorder.resume();
                return;
            }
            
            if (this.audioCtx && this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
                this.mediaRecorder.start(10);
                if (this.onStartCb) {
                    this.onStartCb();
                }
            }
        });
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }
    
    stopMic() {
        this.stopRecording();
        if (this.audioCtx) {
            this.audioCtx.suspend();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.stream = null;
        this.mediaRecorder = null;
    }
    
    onStop() {
        if (this.onStopCb) {
            const blob = new Blob(this.chunks, {'type': this.mediaOptions.mimeType});

            const blobObject = {
                blob,
                startTime: this.startTime,
                stopTime: Date.now(),
                options: this.mediaOptions
            };

            this.onStopCb(blobObject);
        }
        this.chunks = [];
    }

    destroy() {
        this.stopRecording();
        this.stopMic();

        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
    }
    
}