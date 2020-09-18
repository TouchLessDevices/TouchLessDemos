import { AbstractView } from '../core/AbstractView';
import { Globals } from '../../data/Globals';
import { gsap } from 'gsap';
import { DrawingAppSimple } from '../../utils/DrawingAppSimple';
import { UIManager } from '../../utils/UIManager';

export class DrawingView extends AbstractView {
	private _introSection: HTMLDivElement;
	private _demoSection: HTMLDivElement;
	private _drawingApp: DrawingAppSimple;
	private _uiManager: UIManager;

	private _fingerThumb: HTMLDivElement;
	private _fingerIndex: HTMLDivElement;
	private _fingerMiddle: HTMLDivElement;
	private _fingerRing: HTMLDivElement;
	private _fingerPinky: HTMLDivElement;

	constructor(element: HTMLElement, name: string, initial: boolean = false) {
		super(element, name, initial);

		this._introSection = this.element.querySelector('.introScreen');
		this._demoSection = this.element.querySelector('.demoScreen');

		this._fingerThumb = this.element.querySelector('#finger_thumb');
		this._fingerIndex = this.element.querySelector('#finger_index');
		this._fingerMiddle = this.element.querySelector('#finger_middle');
		this._fingerRing = this.element.querySelector('#finger_ring');
		this._fingerPinky = this.element.querySelector('#finger_pinky');

		this._fingerIndex.style.backgroundColor = '#2178e6';
		this._fingerMiddle.style.backgroundColor = '#b6d8fc';
		this._fingerRing.style.backgroundColor = '#0a3265';
		this._fingerPinky.style.backgroundColor = '#ddc676';

		this._uiManager = new UIManager(this.element);

		gsap.set(this.element, { y: -window.innerHeight });
	}

	public in = () => {
		Globals.ACTIVE_VIEW = this;
		Globals.VIEW_MANAGER.addView(this.element);
		gsap.to(this.element, 0.5, { y: 0, ease: 'power1.out', onComplete: this.animatedIn });
		Globals.MAIN.showBackToDemos();
	};

	private animatedIn = () => {
		Globals.PAUSE_HAND_DETECTION = false;
		this._uiManager = new UIManager(this.element);
		this.inComplete();
	};

	public touchCardCallback = actionType => {
		if (actionType === 'startDemo') {
			gsap.to(this._introSection, 0.3, { autoAlpha: 0, onComplete: this.removeIntroScreen });
			this._demoSection.style.display = 'block';
			this._demoSection.style.opacity = '0';
			gsap.to(this._demoSection, 0.3, { autoAlpha: 1 });
			this._uiManager.resize();
			this._drawingApp = new DrawingAppSimple(this._demoSection);

			this._drawingApp.fingerStartTouch(0, 0, 0, '#fadc7b');
			this._drawingApp.fingerStartTouch(1, 0, 0, '#2178e6');
			this._drawingApp.fingerStartTouch(2, 0, 0, '#b6d8fc');
			this._drawingApp.fingerStartTouch(3, 0, 0, '#0a3265');
			this._drawingApp.fingerStartTouch(4, 0, 0, '#ddc676');
		} else if (actionType === 'clear') {
			this.clearDrawing();
		}
	};

	private removeIntroScreen = () => {
		this._introSection.style.display = 'none';
		this._uiManager.resize();
	};

	private clearDrawing = () => {
		this._drawingApp.clear();
	};

	public handLost = () => {};

	public onRequestAnimationFrame = () => {
		if (this._uiManager) {
			this._uiManager.mouseMoved();
		}

		if (this._drawingApp && this._fingerIndex) {
			var useFingers = [this._fingerThumb, this._fingerIndex, this._fingerMiddle, this._fingerRing, this._fingerPinky];

			for (var i = 1; i < useFingers.length; i++) {
				var currentFinger = useFingers[i];
				var indexPos = { x: Number(gsap.getProperty(currentFinger, 'x')), y: Number(gsap.getProperty(currentFinger, 'y')) };

				var scale = Number(gsap.getProperty(currentFinger, 'scale'));
				if (Globals.DOMCursor._fingerPoseResults) {
					var getFingerPose = Globals.DOMCursor._fingerPoseResults.curls[i];

					var setScale = (getFingerPose.angle - 100) / 10;
					if (setScale < 0) {
						setScale = 0.00001;
					}

					gsap.to(currentFinger, 0.1, { scale: setScale / 7, transformOrigin: '0px 0px' });
					scale = setScale / 5;
				}
				this._drawingApp.touchMoved(i, indexPos.x, indexPos.y, scale);
			}
		}
	};

	public reactToDOMCursor = (fingerPoseResults, result) => {
		// Move finger tips

		var isPalmPointing = Globals.HAND_ANALYZER.isRightHandPalmPointingTowardsYourself(result);
		if (isPalmPointing) {
			Globals.HAND_STATE_MANAGER.updateState('palm');
		} else {
			Globals.HAND_STATE_MANAGER.updateState(null);
		}

		Globals.HAND_STATE_MANAGER.checkState();
		if (Globals.HAND_STATE_MANAGER.getState() === 'palm') {
			if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
				Globals.DOMCursor.changeToGoingBackToDemosCursor();
			}
		} else if (Globals.HAND_STATE_MANAGER.getState() === null) {
			if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
				Globals.DOMCursor.changeToDefaultCursor();
			}
		}

		if (Globals.RIGHT_PALM_POINTING === false && Globals.HAND_STATE_MANAGER.handFound() && result) {
			var duration = 0.2;

			gsap.to(this._fingerThumb, duration, {
				ease: 'none',
				x: result[4][0] * Globals.WIDTH_SCALE,
				y: result[4][1] * Globals.HEIGHT_SCALE
			});
			gsap.to(this._fingerIndex, duration, {
				ease: 'none',
				x: result[8][0] * Globals.WIDTH_SCALE,
				y: result[8][1] * Globals.HEIGHT_SCALE
			});
			gsap.to(this._fingerMiddle, duration, {
				ease: 'none',
				x: result[12][0] * Globals.WIDTH_SCALE,
				y: result[12][1] * Globals.HEIGHT_SCALE
			});
			gsap.to(this._fingerRing, duration, {
				ease: 'none',
				x: result[16][0] * Globals.WIDTH_SCALE,
				y: result[16][1] * Globals.HEIGHT_SCALE
			});
			gsap.to(this._fingerPinky, duration, {
				ease: 'none',
				x: result[20][0] * Globals.WIDTH_SCALE,
				y: result[20][1] * Globals.HEIGHT_SCALE
			});
		}
	};

	public out = () => {
		Globals.PAUSE_HAND_DETECTION = true;
		gsap.to(this.element, 0.5, { y: -window.innerHeight, ease: 'power1.in', onComplete: this.outComplete });
		Globals.MAIN.hideBackToDemos();
	};

	kill() {
		this._drawingApp = null;
		super.kill();
	}
}
