import { FingerPoseEstimator } from './FingerPoseEstimator';
import { Finger, FingerCurl, FingerDirection } from './FingerDescription';
import { UIManager } from './UIManager';
import { gsap } from 'gsap';
import { Globals } from '../data/Globals';
import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';

export class DOMCursor {
	private _landmarks: Coords3D;

	public pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

	public WINDOW_WIDTH = window.innerWidth;
	public WINDOW_HEIGHT = window.innerHeight;
	public mouse = { x: 0.5, y: 0.5 };
	public element: HTMLDivElement;

	public centerPosition = { x: 0, y: 0, z: 0 };
	public delayEndClickCall: gsap.core.Tween;
	public clickTween: gsap.core.Tween;

	public fingerPoseEstimator: FingerPoseEstimator;

	public _fingerPoseResults;

	private noHandFoundFeedbackElement: HTMLDivElement = document.querySelector('.handLostFeedback');

	public handVisuals: HTMLDivElement = document.querySelector('#handVisuals');
	public rightSideRing: HTMLDivElement = this.handVisuals.querySelector('.rightSideRing');
	public leftSideRing: HTMLDivElement = this.handVisuals.querySelector('.leftSideRing');
	private _textUnderRing: HTMLDivElement = this.handVisuals.querySelector('.textUnderRing');
	private _borderRing: HTMLDivElement = this.handVisuals.querySelector('.borderRing');
	private _allCircles: HTMLDivElement = this.handVisuals.querySelector('.allCircles');
	private _textInRing: HTMLDivElement = this.handVisuals.querySelector('.textInRing');
	public innerRing: HTMLDivElement;

	private _backToDemosCountdown = { count: 5 };

	private _cursorState: string = 'none';

	constructor(element: HTMLDivElement) {
		this.element = element;

		gsap.set(element, {
			xPercent: -50,
			yPercent: -50,
			x: this.pos.x,
			y: this.pos.y,
			force3D: true,
			pointerEvents: 'none',
			transformOrigin: '50% 50%',
			scale: 0.1
		});

		// Setup defaults
		gsap.set([this.rightSideRing, this.leftSideRing], { opacity: 1, scale: 0.5, transformOrigin: '50% 50%' });
		gsap.set(this.rightSideRing, { x: -45, scale: 0.2, ease: 'power.in', transformOrigin: '50% 50%' });
		gsap.set(this.leftSideRing, { x: 45, scale: 0.2, ease: 'power.in', transformOrigin: '50% 50%' });

		gsap.set(this._borderRing, { transformOrigin: '50% 50%' });

		gsap.set(this._allCircles, { transformOrigin: '50% 50%' });

		this.fingerPoseEstimator = new FingerPoseEstimator(null);

		this.innerRing = this.element.querySelector('.innerRing');
		gsap.set(this.innerRing, {
			transformOrigin: '50% 50%',
			scale: 0.1,
			force3D: true,
			pointerEvents: 'none'
		});

		this.changeToDefaultCursor(true);
	}

	public noHandFoundCallback = () => {
		gsap.to(this.element, 0.5, { opacity: 0, scale: 0.1, ease: 'power1.in' });
		this.changeToDefaultCursor();

		if (Globals.ACTIVE_VIEW && Globals.ACTIVE_VIEW.handLost) {
			Globals.ACTIVE_VIEW.handLost();
		}
		gsap.to(Globals.ZOOMED_CANVAS, 0.5, { autoAlpha: Globals.VIDEO_DEFAULT_ALPHA, overwrite: true });

		this.changeToDefaultCursor();
		Globals.HAND_STATE_MANAGER.updateState('nohandfound');
		Globals.HAND_STATE_MANAGER.checkState();
		Globals.HAND_FOUND = false;
		gsap.to(this.noHandFoundFeedbackElement, 0.3, { y: 0, ease: 'power1.out' });
		Globals.MAIN.hideUseRightHandNotice();
	};

	public noHandFound() {
		// Hand NOT Found - we add it to the No HandFound Count
		Globals.HAND_STATE_MANAGER.noHandFoundCount(this.noHandFoundCallback);
	}

	private onHandFoundCallback = () => {
		console.log('onHandFoundCallback()');
		if (Globals.ACTIVE_VIEW && Globals.ACTIVE_VIEW.handLost) {
			Globals.ACTIVE_VIEW.handFound();
		}

		Globals.HAND_STATE_MANAGER.updateState('handfound');
		Globals.HAND_STATE_MANAGER.checkState();

		if (this.element.style.opacity == '0') {
			gsap.set(this.element, { x: this.centerPosition.x, y: this.centerPosition.y });
		}
		gsap.to(this.element, 0.2, { opacity: 1, scale: 1 });
		gsap.to(Globals.ZOOMED_CANVAS, 0.5, { autoAlpha: 0.1, overwrite: true });
		gsap.to(this.noHandFoundFeedbackElement, 0.3, { y: -200, ease: 'power1.in' });
	};

	public handFound = (landmarks: Coords3D, predictionsRaw) => {
		this._landmarks = landmarks;

		this.centerPosition.x = this._landmarks[9][0] * Globals.WIDTH_SCALE; //percentageMovedX * window.innerWidth - (400 - 272);
		this.centerPosition.y = this._landmarks[9][1] * Globals.HEIGHT_SCALE;

		this.centerPosition.z = this._landmarks[9][2];

		// Adding secondary check to - before we detect the hand - see if the centerPosition is within view
		var newXPos = this.centerPosition.x;
		if (newXPos > 0 && newXPos < window.innerWidth && this.centerPosition.y > 0 && this.centerPosition.y < window.innerHeight) {
			// We also check the bounding box - we only accept bounding boxes over a certain size, this is also done to remove false-positives
			var boundingBox = predictionsRaw.boundingBox;
			var getTopLeft = boundingBox.topLeft;
			var getBottomRight = boundingBox.bottomRight;

			var getWidth = getBottomRight[1] - getTopLeft[1];
			var getHeight = getBottomRight[0] - getTopLeft[0];
			var calcSize = getWidth * getHeight;

			if (calcSize > 5000) {
				// We only want to accept hands thats over a certain size (to better avoid false positives)
				Globals.HAND_STATE_MANAGER.handFoundUpdate(this.onHandFoundCallback);
			}
		} else {
			//	No hand found
		}

		if (Globals.HAND_STATE_MANAGER.handFound() === true) {
			this._fingerPoseResults = this.fingerPoseEstimator.estimate(this._landmarks);
			//var handRotation = Globals.HAND_ANALYZER.getHandRotation(landmarks);

			Globals.FINGER_SPREAD = Globals.HAND_ANALYZER.getFingerSpread(this._fingerPoseResults, landmarks).indexToPinky;

			if (Globals.ACTIVE_VIEW) {
				Globals.ACTIVE_VIEW.reactToDOMCursor(this._fingerPoseResults, this._landmarks);
			}
			var handInnerHeight = Globals.HAND_ANALYZER.findDistanceBetweenThreeDLandMarks(landmarks[1], landmarks[2]);
			Globals.FINGER_SPREAD_NEEDED_FOR_CLICK = 10 * (handInnerHeight / 25);

			if (Globals.HAND_STATE_MANAGER.getState() === null) {
				if (Globals.FINGER_SPREAD > Globals.FINGER_SPREAD_NEEDED_FOR_CLICK) {
					this.changeToClickCursor();
				} else {
					this.changeToDefaultCursor();
				}
			}

			var duration = 0.2;
			var delay = 0.1;

			if (Globals.HAND_STATE_MANAGER.handFound() && this._landmarks) {
				gsap.to(this.element, duration, {
					delay: delay,
					ease: 'none',
					x: this.centerPosition.x,
					y: this.centerPosition.y
				});
			}
		}
	};

	public changeToDefaultCursor = (force?: boolean, fadeDown?: boolean) => {
		if (this._cursorState !== 'default') {
			var duration = 0.2;
			if (force === true) {
				duration = 0;
			}

			var setOpacity = 1;
			if (fadeDown === true) {
				setOpacity = 0.3;
			}

			gsap.killTweensOf(this._backToDemosCountdown);
			gsap.to(this.innerRing, duration, { ease: 'power1.inOut', scale: 0.1, opacity: setOpacity });
			gsap.to(this._borderRing, duration, { ease: 'power1.inOut', scale: 1, opacity: setOpacity, rotation: '0short' });
			gsap.to(this.rightSideRing, duration, { scaleY: 0.1, scaleX: 0.01, x: -70, opacity: 0, ease: 'power1.in' });
			gsap.to(this.leftSideRing, duration, { scaleY: 0.1, scaleX: 0.01, x: 25, opacity: 0, ease: 'power1.in' });
			gsap.to(this._textUnderRing, duration, { opacity: 0, scale: 0.1 });
			gsap.to(this._textInRing, duration, { autoAlpha: 0, scale: 0.1 });

			this._cursorState = 'default';
		}
	};

	public changeToDragCursor = () => {
		if (this._cursorState !== 'drag') {
			gsap.killTweensOf(this._backToDemosCountdown);
			gsap.to(this._borderRing, 0.4, { scale: 0.5, ease: 'power1.inOut' });
			gsap.to(this.innerRing, 0.4, { ease: 'power1.inOut', scale: 0.1, overwrite: true });
			gsap.to(this.rightSideRing, 0.4, { x: -10, opacity: 1, scale: 0.2, ease: 'power1.out' });
			gsap.to(this.leftSideRing, 0.4, { x: -10, opacity: 1, scale: 0.2, ease: 'power1.out' });
			this._cursorState = 'drag';
		}
	};

	public changeToClickCursor = () => {
		if (this._cursorState !== 'click') {
			gsap.killTweensOf(this._backToDemosCountdown);
			gsap.to(this._borderRing, 3, { scale: 1.5, rotation: '+=360short' });
			gsap.to(this.innerRing, 0.2, { ease: 'power1.inOut', scale: 0.8 });
			this._cursorState = 'click';
		}
	};

	public changeToGoingBackToDemosCursor = () => {
		if (this._cursorState !== 'backToDemos') {
			gsap.to(this.innerRing, 0.2, { ease: 'power.inOut', scale: 0.001 });
			gsap.to(this._textUnderRing, 0.2, { opacity: 1, scale: 1 });
			gsap.to(this._textInRing, 0.2, { autoAlpha: 1, scale: 1 });

			this._backToDemosCountdown.count = 5;
			this.updateCountDown();
			gsap.to(this._borderRing, 4, { ease: 'power.inOut', scale: 1 });
			gsap.to(this._backToDemosCountdown, 4, { ease: 'none', count: 0, onComplete: this.gotoMainView, onUpdate: this.updateCountDown });
			this._cursorState = 'backToDemos';
		}
	};

	private updateCountDown = () => {
		this._textInRing.innerHTML = String(Math.round(this._backToDemosCountdown.count));
	};

	public gotoMainView = () => {
		this.changeToDefaultCursor();
		Globals.VIEW_MANAGER.setPath('demo-overview');
	};

	public raf = () => {
		this.pos.x = Number(gsap.getProperty(this.element, 'x'));
		this.pos.y = Number(gsap.getProperty(this.element, 'y'));

		if (Globals.ACTIVE_VIEW) {
			Globals.ACTIVE_VIEW.onRequestAnimationFrame();
		}
	};
}
