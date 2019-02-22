import React from 'react';
import MicrophoneRecorder from '../libs/MicrophoneRecorder';
import AudioContext from '../libs/AudioContext';
import AudioPlayer from '../libs/AudioPlayer';
import Visualizer from '../libs/Visualizer';
import equal from '../libs/equal';

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
        constraints: {},
        keepMicOpen: false
    };

    constructor(props) {
        super(props);
        this.audioContext = null;
        this.microphoneRecorder = null;
        this.canvasRef = null;
        this.canvasCtx = null;
        this.state = {
            recording: false
        };
    }

    start() {
        if (this.microphoneRecorder && !this.state.recording) {
            this.microphoneRecorder.startRecording(this.props.constraints);
            this.visualize();
            this.setState({
                recording: true
            });
        }
    }

    stop() {
        if (this.microphoneRecorder) {
            this.microphoneRecorder.stopRecording();
            if (!this.props.keepMicOpen) {
                this.microphoneRecorder.stopMic();
                if (this.props.stopMic) {
                    this.props.stopMic();
                }
            }
        }
        if (this.visualizer && !this.props.keepMicOpen) {
            this.visualizer.stop();
        }
        this.setState({
            recording: false
        });
    }
    
    componentDidUpdate(prevProps) {
        if (!this.state.recording && !this.props.keepMicOpen && this.microphoneRecorder) {
            this.microphoneRecorder.stopMic();
            if (this.props.stopMic) {
                this.props.stopMic();
            }
        } else {
            this.visualize();
        }
        if (this.microphoneRecorder) {
            this.microphoneRecorder.onStartMic = this.props.onStartMic;

            if (!this.state.recording && !equal(this.props.constraints, prevProps.constraints)) {
                this.microphoneRecorder.stopMic();
                if (this.props.keepMicOpen) {
                    this.microphoneRecorder.startMic(this.props.constraints)
                        .catch(error => {
                            if (this.props.onError) {
                                this.props.onError(error);
                            }
                        });
                }
            }
        }
    }

    componentDidMount() {
        
        const {
            onStop,
            onStart,
            onStartMic,
            onStopMic,
            onData,
            audioElem,
            audioBitsPerSecond,
            mimeType,
            keepMicOpen
        } = this.props;

        const options = {audioBitsPerSecond, mimeType};
        this.canvasCtx = this.canvasRef.getContext("2d");
        
        this.audioContext = new AudioContext();
        
        if (audioElem) {
            this.audioPlayer = new AudioPlayer(audioElem, this.audioContext);
        } else {
            this.microphoneRecorder = new MicrophoneRecorder(onStart, onStop, onData, options, this.audioContext);
            this.microphoneRecorder.onStartMic = onStartMic;
        }

        if (keepMicOpen && this.microphoneRecorder) {
            this.microphoneRecorder.startMic(this.props.constraints)
                .catch(error => {
                    if (this.props.onError) {
                        this.props.onError(error);
                    }
                });
        }

        this.visualize();
    }
    
    componentWillUnmount() {
        if (this.visualizer) {
            this.visualizer.stop();
        }
        if (this.microphoneRecorder) {
            this.microphoneRecorder.destroy();
            this.microphoneRecorder = null;
            if (this.props.stopMic) {
                this.props.stopMic();
            }
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
