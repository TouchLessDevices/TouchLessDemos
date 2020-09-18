import { Back, Linear, Power1, Power2, gsap } from 'gsap';
import { Globals } from '../data/Globals';

export class SetupVideo {
	private _showDebugVideo: boolean = false;
	private _userFeedVideo: HTMLVideoElement;
	private _videoContainer: HTMLDivElement;
	private _zoomedCanvas: HTMLCanvasElement;
	private _zoomedCanvasContext: CanvasRenderingContext2D;

	private _successCallback: Function;

	constructor(successCallback: Function) {
		this._successCallback = successCallback;
		this.setupVideo();
	}

	private setupVideo = () => {
		Globals.VIDEO_SETUP = true;
		this._userFeedVideo = document.querySelector('#userFeedVideo') as HTMLVideoElement;
		this._userFeedVideo.addEventListener('loadeddata', this.videoStarted);

		this._videoContainer = document.querySelector('#videoContainer') as HTMLDivElement;
		Globals.USER_VIDEO_CONTAINER = this._videoContainer;

		// Calculate an area we want to use as our focus area
		// Used for debugging
		if (this._showDebugVideo === true) {
			var box = document.createElement('div');
			box.style.position = 'absolute';
			box.style.zIndex = '999999';

			box.style.border = 'solid 1px red';
			box.style.left = Globals.VIDEO_WIDTH / 2 + 'px';
			box.style.width = (Globals.VIDEO_WIDTH / 2) * 0.85 + 'px';

			box.style.top = Globals.VIDEO_HEIGHT * 0.15 + 'px';
			box.style.height = Globals.VIDEO_HEIGHT * 0.7 + 'px';
			this._videoContainer.appendChild(box);
			this._videoContainer.style.display = 'block';
		}
		this._zoomedCanvas = document.querySelector('#zoomedAreaCanvas');
		Globals.ZOOMED_CANVAS = this._zoomedCanvas;
		this._zoomedCanvasContext = this._zoomedCanvas.getContext('2d');

		gsap.set(this._zoomedCanvas, { filter: 'contrast(1500%) grayscale(100%)' });

		var video = this._userFeedVideo;

		let options = { audio: false, video: true, facingMode: 'user', width: { ideal: Globals.VIDEO_WIDTH }, height: { ideal: Globals.VIDEO_HEIGHT } };

		if (navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices
				.getUserMedia({
					audio: false,
					video: options
				})
				.then(function(stream) {
					video.srcObject = stream;
					let promise = video.play();

					if (promise !== undefined) {
						promise
							.then(() => {})
							.catch(error => {
								console.log(error);
								//	alert('Error: Camera not allowed');
							});
					}
				})
				.catch(function(error) {
					console.log(error);
					alert(
						"Unfortunately we could not access your camera (either you clicked disallow or the camera wasn't found) - check your camera settings by clicking the camera icon in the browserbar. And reload the page."
					);
					//alert('Error: Camera not allowed');
				});
		}

		window.addEventListener('resize', this.resize);
		this.resize();
	};

	private resize = (event?: Event) => {
		if (this._zoomedCanvas) {
			this._zoomedCanvas.width = (Globals.VIDEO_WIDTH / 2) * 0.85;
			this._zoomedCanvas.height = Globals.VIDEO_HEIGHT * 0.7;

			var canvasFullScaleX = window.innerWidth / this._zoomedCanvas.width;
			var canvasFullScaleY = window.innerHeight / this._zoomedCanvas.height;

			Globals.WIDTH_SCALE = canvasFullScaleX;
			Globals.HEIGHT_SCALE = canvasFullScaleY;
			gsap.set(this._zoomedCanvas, { left: canvasFullScaleX * this._zoomedCanvas.width + 'px', scaleX: canvasFullScaleX * -1, scaleY: canvasFullScaleY, rotate: 0, transformOrigin: '0% 0%' });
		}
	};

	public drawVideoToCanvas = () => {
		var startXPosition: number = Math.round((Globals.VIDEO_WIDTH / 2) * 0.3);
		var startYPosition: number = Math.round((Globals.VIDEO_HEIGHT / 2) * 0.15);
		this._zoomedCanvasContext.drawImage(
			this._userFeedVideo,
			startXPosition,
			startYPosition,
			this._zoomedCanvas.width,
			this._zoomedCanvas.height - startYPosition,
			0,
			0,
			this._zoomedCanvas.width,
			this._zoomedCanvas.height
		);
	};

	private videoStarted = event => {
		this.cameraAccessGiven();
	};

	private cameraAccessGiven = () => {
		this._successCallback();
		//	this.startDetection();
	};

	public getVideoFeed = () => {
		return this._userFeedVideo;
	};

	public getZoomedCanvas = () => {
		return this._zoomedCanvas;
	};
}
