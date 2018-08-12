export default class MicrophoneRecorder {
    constructor(onStart, onStop, onData, options, audioContext) {
        
        this.audioCtx = audioContext.getAudioContext();
        this.analyser = audioContext.getAnalyser();
        this.stream = null;
        this.onStartCb = onStart;
        this.onStopCb = onStop;
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

                this.stream = str;

                const source = this.audioCtx.createMediaStreamSource(this.stream);
                source.connect(this.analyser);

                console.log('got mic', this.audioCtx.state);
                if (this.audioCtx && this.audioCtx.state === 'suspended') {
                    console.log('resuming audio context');
                    this.audioCtx.resume();
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
                console.log('resuming mediaRecorder');
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
        console.log('suspending audio context');
        this.audioCtx.suspend();
        this.stream && this.stream.getTracks()[0].stop();
        this.stream = null;
        this.mediaRecorder = null;
    }
    
    onStop() {
        const blob = new Blob(this.chunks, {'type': this.mediaOptions.mimeType});
        this.chunks = [];
        
        const blobObject = {
            blob,
            startTime: this.startTime,
            stopTime: Date.now(),
            options: this.mediaOptions
        };
        
        if (this.onStopCb) {
            this.onStopCb(blobObject);
        }
        
    }
    
}