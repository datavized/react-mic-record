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
    
    startRecording(constraintOpts = {}) {
        this.startTime = Date.now();
        
        if (this.mediaRecorder) {
            
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            
            if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
                this.mediaRecorder.resume();
                return;
            }
            
            if (this.audioCtx && this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
                this.mediaRecorder.start(10);
                const source = this.audioCtx.createMediaStreamSource(this.stream);
                source.connect(this.analyser);
                if (this.onStartCb) {
                    this.onStartCb();
                }
            }
        } else {
            if (navigator.mediaDevices) {
                console.log('getUserMedia supported.');
                const constraints = {
                    audio: true,
                    ...constraintOpts,
                    video: false
                };
                navigator.mediaDevices.getUserMedia(constraints).then(str => {
                    
                    this.stream = str;
                    
                    if (MediaRecorder.isTypeSupported(this.mediaOptions.mimeType)) {
                        this.mediaRecorder = new MediaRecorder(this.stream, this.mediaOptions);
                    } else {
                        this.mediaRecorder = new MediaRecorder(this.stream);
                    }
                    
                    if (this.onStartCb) {
                        this.onStartCb();
                    }
                    
                    this.mediaRecorder.addEventListener('stop', () => this.onStop());
                    this.mediaRecorder.addEventListener('dataavailable', e => {
                        this.chunks.push(e.data);
                        if (this.onData) {
                            this.onData(e.data);
                        }
                    });
                    
                    this.mediaRecorder.start(10);
                    
                    const source = this.audioCtx.createMediaStreamSource(this.stream);
                    source.connect(this.analyser);
                    
                });
            } else {
                alert('Your browser does not support audio recording');
            }
        }
        
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.audioCtx.suspend();
        }
    }
    
    unMount() {
        this.stream && this.stream.getTracks()[0].stop();
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