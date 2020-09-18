import { gsap } from 'gsap';
import { Globals } from '../data/Globals';
import { SetupVideo } from './SetupVideo';
import { HandPoseDetection } from './HandPoseDetection';
import { ViewManager } from '../managers/ViewManager';
import { TutorialView } from '../views/TutorialView/TutorialView';
import { MainView } from '../views/MainView/MainView';
import { DrawingView } from '../views/DrawingView/DrawingView';
import { HowWasYourExperience } from '../views/HowWasYourExperience/HowWasYourExperience';
import { ElevatorView } from '../views/ElevatorView/ElevatorView';
import { VideoPlayerView } from '../views/VideoPlayerView/VideoPlayerView';
import { RestaurantOrderingView } from '../views/RestaurantOrderingView/RestaurantOrderingView';
import { ActiveStateController } from '../utils/ActiveStateController';

export class Preloader {
	private _homeContainer: HTMLDivElement;
	private _homeAllowWebcamButton: HTMLDivElement;

	private _logo: HTMLDivElement;

	private _homeBottomText: HTMLDivElement;

	private _preloaderContainer: HTMLDivElement;
	private _preloaderImageContainer: HTMLDivElement;
	private _videoElement: HTMLVideoElement;

	private _setupVideo: SetupVideo;

	// Hints
	private _hintElement: HTMLDivElement;
	private _hintCount: number = 0;
	private _hintTexts = [
		'In a few seconds we will teach you how to navigate with just your hand',
		'Use your right hand to navigate',
		'Make sure your location is well lit',
		"Don't put your hand to close to the screen",
		'Use slow movements for more accurate detection',
		'The Hand Detection can only detect one hand at a time',
		'Built using HandPose'
	];

	private element;

	constructor(element: HTMLElement) {
		this.element = element;

		this._homeContainer = this.element.querySelector('.home');
		this._homeAllowWebcamButton = this._homeContainer.querySelector('.allowWebcamButton');
		if (Globals.SHOW_TURN_ON_WEBCAM === true) {
			this._homeAllowWebcamButton.addEventListener('click', this.enterSiteClicked);
		} else {
			this._homeAllowWebcamButton.style.opacity = '0.2';
		}
		this._homeBottomText = this._homeContainer.querySelector('.bottomText');

		this._preloaderContainer = this.element.querySelector('.preloader');
		this._preloaderImageContainer = this._preloaderContainer.querySelector('.loaderImage');
		this._videoElement = this._preloaderContainer.querySelector('video');
		this._hintElement = this._preloaderContainer.querySelector('.hint');
		this._logo = document.querySelector('.logo');

		gsap.set(this._videoElement, { y: 208 });
		gsap.set(this._homeBottomText, { y: 100 });

		this.init();

		if (Globals.AUTO_SKIP_CAMERA) {
			this.enterSiteClicked();
		}
	}

	private init = () => {
		gsap.to(this._logo, 0.7, { delay: 0.4, y: 0, ease: 'power2.out' });

		gsap.to(this._homeContainer, 0.7, { opacity: 1 });

		gsap.to(this._homeBottomText, 0.7, { delay: 0.4, y: 0, ease: 'power2.out' });
	};

	private enterSiteClicked = (event?: MouseEvent) => {
		this._homeAllowWebcamButton.removeEventListener('click', this.enterSiteClicked);
		this._setupVideo = new SetupVideo(this.onCameraAccesGiven);
		Globals.SETUP_VIDEO = this._setupVideo;
	};

	private onCameraAccesGiven = () => {
		gsap.to(this._homeContainer, 0.5, { autoAlpha: 0 });
		gsap.to(this._preloaderContainer, 0.5, { delay: 0.5, autoAlpha: 1, onComplete: this.startPreloader });
		gsap.to(this._videoElement, 0.5, { y: 0, ease: 'power1.out' });
	};

	private startPreloader = () => {
		this.updateText();

		if (Globals.DEBUG_TURN_OFF_HANDPOSE === true) {
			this.handPoseReady();
		} else {
			new HandPoseDetection(this.handPoseReady, this._setupVideo.getVideoFeed());
		}
	};

	private updateText = () => {
		if (this._hintCount >= this._hintTexts.length) {
			this._hintCount = 1;
		}

		this._hintElement.innerHTML = this._hintTexts[this._hintCount];

		this._hintCount++;

		gsap.delayedCall(4, this.updateText);
	};

	private handPoseReady = () => {
		Globals.MAIN.startGlobalRAF();
		this.animateOut();
	};

	private animateOut = () => {
		gsap.killTweensOf(this.updateText);
		gsap.to(this._videoElement, 0.3, { y: 308, ease: 'power1.in' });

		gsap.to(this.element, 0.3, { delay: 0.3, opacity: 0, onComplete: this.kill });
	};

	private kill = () => {
		this.element.parentNode.removeChild(this.element);

		Globals.VIEW_MANAGER = new ViewManager(document.body.querySelector('#ViewContainer'));

		Globals.VIEW_MANAGER.registerView({ name: 'TutorialView', view: TutorialView });
		Globals.VIEW_MANAGER.registerView({ name: 'MainView', view: MainView });
		Globals.VIEW_MANAGER.registerView({ name: 'DrawingView', view: DrawingView });
		Globals.VIEW_MANAGER.registerView({ name: 'HowWasYourExperienceView', view: HowWasYourExperience });
		Globals.VIEW_MANAGER.registerView({ name: 'RestaurantOrderingView', view: RestaurantOrderingView });
		Globals.VIEW_MANAGER.registerView({ name: 'ElevatorView', view: ElevatorView });
		Globals.VIEW_MANAGER.registerView({ name: 'VideoPlayerView', view: VideoPlayerView });

		gsap.to(this._setupVideo.getZoomedCanvas(), 0.3, { autoAlpha: Globals.VIDEO_DEFAULT_ALPHA });

		Globals.VIEW_MANAGER.init();

		if (Globals.SKIP_TO_MAIN_SCREEN === true) {
			Globals.VIEW_MANAGER.setPath('demo-overview');
		}
	};
}
