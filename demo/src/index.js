import React, {Component} from 'react';
import {render} from 'react-dom';
import ReactMicRecord from '../../src';

require('./styles.scss');

export default class Demo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            record: false,
            blobObject: null,
            isRecording: false
        }
        this.recorder = null;
    }
    
    startRecording() {
        if (this.recorder) {
            this.recorder.start();
        }
    }
    
    stopRecording() {
        if (this.recorder) {
            this.recorder.stop();
        }
    }
    
    onStart() {
        this.setState({
            record: true,
            isRecording: true
        });
    }
    
    onStop(blobObject) {
        this.setState({
            record: false,
            isRecording: false,
            blobURL: blobObject.blobURL
        });
    }
    
    render() {
        const {isRecording, blobURL} = this.state;
        
        return (
            <React.Fragment>
                <ReactMicRecord
                    className="oscilloscope"
                    ref={ref => this.recorder = ref}
                    backgroundColor="#2885c7"
                    audioBitsPerSecond={128000}
                    onStop={blobObject => this.onStop(blobObject)}
                    onStart={() => this.onStart()}
                    strokeColor="#ffffff"
                />
                {!isRecording ?
                    <React.Fragment>
                        <button
                            className="btn"
                            disabled={isRecording}
                            onClick={() => this.startRecording()}>
                            Record
                        </button>
                        <audio ref="audioSource" controls="controls" src={blobURL}/>
                    </React.Fragment>
                    :
                    <div>
                        <button
                            className="btn"
                            disabled={!isRecording}
                            onClick={() => this.stopRecording()}>
                            Stop
                        </button>
                    </div>
                }
            </React.Fragment>
        );
    }
}

render(<Demo/>, document.querySelector('#demo'))
