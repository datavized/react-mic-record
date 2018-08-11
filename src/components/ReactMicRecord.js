import React from 'react';
import MicrophoneRecorder from '../libs/MicrophoneRecorder';
import AudioContext from '../libs/AudioContext';
import AudioPlayer from '../libs/AudioPlayer';
import Visualizer from '../libs/Visualizer';

export default class ReactMicRecord extends React.Component {
    
    static defaultProps = {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        strokeColor: '#000000',
        className: 'visualizer',
        audioBitsPerSecond: 128000,
        mimeType: 'audio/webm;codecs=opus',
        width: 640,
        height: 100,
        visualSetting: 'sinewave',
        constraints: {}
    };
    
    constructor(props) {
        super(props);
        this.audioContext = null;
        this.microphoneRecorder = null;
        this.canvasRef = null;
        this.canvasCtx = null;
    }

    start(constraints) {
        if (this.microphoneRecorder) {
            this.microphoneRecorder.startRecording(constraints);
            this.visualize();
        }
    }

    stop() {
        if (this.microphoneRecorder) {
            this.microphoneRecorder.stopRecording();
        }
        if (this.visualizer) {
            this.visualizer.stop();
        }
    }
    
    componentDidMount() {
        
        const {onStop, onStart, onData, audioElem, audioBitsPerSecond, mimeType} = this.props;
        const options = {audioBitsPerSecond, mimeType};
        this.canvasCtx = this.canvasRef.getContext("2d");
        
        this.audioContext = new AudioContext();
        
        if (audioElem) {
            this.audioPlayer = new AudioPlayer(audioElem, this.audioContext);
        } else {
            this.microphoneRecorder = new MicrophoneRecorder(onStart, onStop, onData, options, this.audioContext);
        }
        
        this.visualize();
    }
    
    componentWillUnmount() {
        if (this.visualizer) {
            this.visualizer.stop();
        }
        if (this.microphoneRecorder) {
            this.microphoneRecorder.unMount();
        }
    }
    
    visualize() {
        const {backgroundColor, strokeColor, width, height, visualSetting} = this.props;
        
        if (this.visualizer) {
            this.visualizer.stop();
        }

        this.visualizer = new Visualizer(this.audioContext, this.canvasCtx, this.canvasRef, width, height, backgroundColor, strokeColor);
        
        if (visualSetting === 'sinewave') {
            this.visualizer.visualizeSineWave();
            
        } else if (visualSetting === 'frequencyBars') {
            this.visualizer.visualizeFrequencyBars();
        }
    }
    
    clear() {
        const {width, height} = this.props;
        this.canvasCtx && this.canvasCtx.clearRect(0, 0, width, height);
    }
    
    render() {
        const {width, height, className} = this.props;
        
        return <canvas ref={c => this.canvasRef = c} height={height} width={width} className={className}/>;
    }
}
