import { AbstractView } from '../core/AbstractView';
import { Globals } from '../../data/Globals';
import { gsap } from 'gsap';
import { UIManager } from '../../utils/UIManager';
import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';

export class VideoPlayerView extends AbstractView {
	private _introSection: HTMLDivElement;
	private _demoSection: HTMLDivElement;
	private uiManager: UIManager;

	// YouTubePlayer
	private player;
	private done;
	private youtubeVideoReady: boolean = false;
	private videoPlaying: boolean = true;
	private percentageSeeked: number = 0;
	private currentTime: number = 0;
	private totalTime: number = 0;
	private updateTimeInterval: number;

	// Element
	private time;
	private scrubberElement;
	private playButton: HTMLDivElement;
	private pauseButton: HTMLDivElement;

	// Drag
	private distanceMovedPos = { x: 0, y: 0, z: 0 };
	private startPos = { x: 0, y: 0, z: 0 };
	private elementPosition = { start: { x: 0, y: 0, z: 0 }, current: { x: 0, y: 0, z: 0 } };

	private _atDemoScreen: boolean = false;

	constructor(element: HTMLElement, name: string, initial: boolean = false) {
		super(element, name, initial);

		this._introSection = this.element.querySelector('.introScreen');
		this._demoSection = this.element.querySelector('.demoScreen');
		this.playButton = this.element.querySelector('.playButton');
		this.pauseButton = this.element.querySelector('.pauseButton');

		this.element = element;
		this.time = this.element.querySelector('.time');
		this.scrubberElement = this.element.querySelector('.scrubberElement');
		gsap.set(this.element, { y: -window.innerHeight });
	}

	public touchCardCallback = actionType => {
		console.log('actionType : ' + actionType);
		if (actionType === 'startDemo') {
			gsap.to(this._introSection, 0.3, { autoAlpha: 0 });
			this._demoSection.style.display = 'block';
			this._demoSection.style.opacity = '0';
			gsap.to(this._demoSection, 0.3, { autoAlpha: 1, onComplete: this.hideIntroScreen });
			this.uiManager.resize();
			this.onYouTubeIframeAPIReady();
		} else if (actionType === 'play-pause') {
			this.clickPlayPause();
		}
	};

	private hideIntroScreen = () => {
		this._introSection.style.display = 'none';
		this.uiManager.resize();
	};

	public handLost = () => {
		this.dragEnd();
	};

	public reactToDOMCursor = (fingerPoseResults, result: Coords3D) => {
		var isGrabbing = Globals.HAND_ANALYZER.isGrabbing(fingerPoseResults);
		var isPalmPointing = Globals.HAND_ANALYZER.isRightHandPalmPointingTowardsYourself(result);

		//console.log(isClicking)
		if (isPalmPointing) {
			Globals.HAND_STATE_MANAGER.updateState('palm');
		} else if (isGrabbing >= 3) {
			Globals.HAND_STATE_MANAGER.updateState('grab');
		} else {
			Globals.HAND_STATE_MANAGER.updateState(null);
		}

		Globals.HAND_STATE_MANAGER.checkState();

		if (Globals.HAND_STATE_MANAGER.getState() === 'palm') {
			if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
				Globals.DOMCursor.changeToGoingBackToDemosCursor();
			}
		} else if (Globals.HAND_STATE_MANAGER.getState() === 'grab') {
			if (this._atDemoScreen === true) {
				Globals.IS_DRAGGING = true;
				if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
					Globals.DOMCursor.changeToDragCursor();
					this.dragStart(window.innerWidth - Globals.DOMCursor.pos.x, Globals.DOMCursor.pos.y, 0);
				} else {
					this.dragMove(window.innerWidth - Globals.DOMCursor.pos.x, Globals.DOMCursor.pos.y);
				}
			}
		} else if (Globals.HAND_STATE_MANAGER.getState() === null && Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
			Globals.DOMCursor.changeToDefaultCursor();

			Globals.IS_DRAGGING = false;
			this.dragEnd();
		}
	};

	private clickPlayPause = () => {
		if (this.videoPlaying === true) {
			this.pauseVideo();
			this.pauseButton.style.display = 'none';
			this.playButton.style.display = 'block';
		} else {
			this.pauseButton.style.display = 'block';
			this.playButton.style.display = 'none';
			this.playVideo();
		}
	};

	private pauseVideo = () => {
		this.player.pauseVideo();
		this.videoPlaying = false;
	};

	private playVideo = () => {
		if (this.player && this.player.playVideo) {
			this.player.playVideo();
		}
		this.videoPlaying = true;
	};

	public dragStart = (x, y, z) => {
		this.distanceMovedPos.x = 0;
		this.distanceMovedPos.y = 0;
		this.startPos.x = x;
		this.startPos.y = y;
		this.elementPosition.start.x = Number(gsap.getProperty(this.scrubberElement, 'x'));
		this.elementPosition.start.y = Number(gsap.getProperty(this.scrubberElement, 'x'));
	};

	public dragMove = (x, y) => {
		this.distanceMovedPos.x = this.startPos.x - x;
		this.distanceMovedPos.y = this.startPos.y - y;

		var newXPos = this.distanceMovedPos.x * 1.3 + this.elementPosition.start.x;
		var newYPos = this.distanceMovedPos.y * -1 + this.elementPosition.start.y;

		if (newXPos > window.innerWidth - 200) {
			newXPos = window.innerWidth - 200;
		} else if (newXPos < 0) {
			newXPos = 0;
		}

		//y: newYPos,
		gsap.to(this.scrubberElement, 0.1, {
			delay: 0.1,
			ease: 'none',
			x: newXPos,
			onUpdate: this.dragStorePosition,
			onUpdateParams: [newXPos, newYPos]
		});

		var percentageMovedOfScreenWidth = newXPos / window.innerWidth;
		var calcTimeToGoTo = percentageMovedOfScreenWidth * this.totalTime;

		this.player.seekTo(calcTimeToGoTo);
		this.updateTime();
	};

	private dragStorePosition = (x, y) => {
		this.elementPosition.current.x = x;
		this.elementPosition.current.y = y;
		this.resize();
	};

	private updateTime = () => {
		if (this.player && this.player.getCurrentTime) {
			this.currentTime = this.player.getCurrentTime();
			this.percentageSeeked = this.currentTime / this.totalTime;

			this.time.innerHTML = this.secondsToTime(this.currentTime) + ' / ' + this.secondsToTime(this.totalTime);
		}
	};

	private secondsToTime = timeInSeconds => {
		var pad = function(num, size) {
			return ('000' + num).slice(size * -1);
		};
		var time: number = Number(parseFloat(timeInSeconds).toFixed(3));
		var hours: number = Math.floor(time / 60 / 60);
		var minutes: number = Math.floor(time / 60) % 60;
		var seconds: number = Math.floor(time - minutes * 60);
		//	var milliseconds = time.slice(-3);
		// + ',' + pad(milliseconds, 3)
		return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2);
	};

	public dragEnd = () => {};

	public onRequestAnimationFrame = () => {
		if (this.uiManager) {
			this.uiManager.mouseMoved();
		}
	};

	public in = () => {
		Globals.ACTIVE_VIEW = this;
		Globals.VIEW_MANAGER.addView(this.element);
		gsap.to(this.element, 0.5, { y: 0, ease: 'power1.out', onComplete: this.animatedIn });
		Globals.MAIN.showBackToDemos();
	};

	private animatedIn = () => {
		this.uiManager = new UIManager(this.element);
		Globals.PAUSE_HAND_DETECTION = false;
	};

	private onPlayerReady = event => {
		console.log('onPlayerReady');
		this.totalTime = this.player.getDuration();
		this.updateTime();
		event.target.playVideo();
		this.youtubeVideoReady = true;
		this.updateTimeInterval = setInterval(this.updateTime, 1000);
	};

	private onPlayerStateChange = event => {
		if (event.data == window['YT'].PlayerState.PLAYING && !this.done) {
			//	setTimeout(stopVideo, 6000);
			this.done = true;
		}
	};
	//sv3TXMSv6Lw - aEnfy9qfdaU
	private onYouTubeIframeAPIReady = () => {
		console.log('onYouTubeIframeAPIReady');
		this.player = new window['YT'].Player('player', {
			height: '360',
			width: '640',
			videoId: 'sv3TXMSv6Lw',
			events: {
				onReady: this.onPlayerReady,
				onStateChange: this.onPlayerStateChange
			}
		});

		this._atDemoScreen = true;
	};

	public out = () => {
		if (this.player && this.player.stopVideo) {
			console.log(this.player);
			this.player.stopVideo();
		}
		clearInterval(this.updateTimeInterval);
		Globals.PAUSE_HAND_DETECTION = true;
		gsap.to(this.element, 0.5, { y: -window.innerHeight, ease: 'power1.in', onComplete: this.outComplete });
		Globals.MAIN.hideBackToDemos();
	};

	kill() {
		if (this.player && this.player.destroy) {
			this.player.destroy();
		}
		super.kill();
	}
}
