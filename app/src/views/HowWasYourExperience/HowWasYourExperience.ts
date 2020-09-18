import { AbstractView } from '../core/AbstractView';
import { Globals } from '../../data/Globals';
import { gsap } from 'gsap';
import { DOMCursor } from '../../utils/DOMCursor';
import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';
import { UIManager } from '../../utils/UIManager';

export class HowWasYourExperience extends AbstractView {
	private uiManager: UIManager;
	public element;

	private _introSection: HTMLDivElement;
	private _demoSection: HTMLDivElement;
	private _endScreen: HTMLDivElement;
	private _smileyCards;

	constructor(element: HTMLElement, name: string, initial: boolean = false) {
		super(element, name, initial);
		this.element = element;

		this._introSection = this.element.querySelector('.introScreen');
		this._demoSection = this.element.querySelector('.demoScreen');
		this._endScreen = this.element.querySelector('.endScreen');

		this._smileyCards = this._demoSection.querySelectorAll('.TouchCard');

		gsap.set(this.element, { y: -window.innerHeight });
		gsap.set(this._smileyCards, { z: -500, rotationY: -45, opacity: 0.0, transformOrigin: '50% 50%' });
	}

	public touchCardCallback = actionType => {
		if (actionType === 'startDemo') {
			gsap.to(this._introSection, 0.3, { autoAlpha: 0, onComplete: this.removeIntroScreen });
			this._demoSection.style.display = 'block';
			this._demoSection.style.opacity = '0';
			gsap.to(this._demoSection, 0.3, { autoAlpha: 1 });
			gsap.to(this._smileyCards, 0.4, { delay: 0.3, z: 0, rotationY: 0, opacity: 1, ease: 'power1.inOut', onComplete: this.uiManager.resize });
		} else if (actionType === 'smiley-happy') {
			this.smileySelected(0);
		} else if (actionType === 'smiley-semi-happy') {
			this.smileySelected(1);
		} else if (actionType === 'smiley-neutral') {
			this.smileySelected(2);
		} else if (actionType === 'smiley-unhappy') {
			this.smileySelected(3);
		}
	};

	private removeIntroScreen = () => {
		this._introSection.style.display = 'none';
		this.uiManager.resize();
	};

	private smileySelected(smileyCount) {
		for (var i = 0; i < this._smileyCards.length; i++) {
			var currentSmiley = this._smileyCards[i];
			var delay = 0.2;
			if (i === smileyCount) {
				delay = 0.0;
			}
			gsap.to(currentSmiley, 0.5, { ease: 'power1.inOut', z: -200, delay: delay, rotationY: -45, opacity: 0.3 });
		}
		gsap.set(this._endScreen, { y: -10 });
		gsap.to(this._endScreen, 0.5, { y: 0, autoAlpha: 1, ease: 'power1.in' });

		gsap.delayedCall(1, this.showSmileysAgain);
	}

	private showSmileysAgain = () => {
		gsap.to(this._endScreen, 0.3, { autoAlpha: 0, y: 10, ease: 'power1.in' });
		gsap.to(this._smileyCards, 0.4, { delay: 0.3, z: 0, rotationY: 0, opacity: 1, ease: 'power1.inOut' });
	};

	public handLost = () => {};

	public handFound = () => {};

	public reactToDOMCursor = (fingerPoseResults, result: Coords3D) => {
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
			Globals.DOMCursor.changeToDefaultCursor();
		}
	};

	public onRequestAnimationFrame = () => {
		if (this.uiManager) {
			this.uiManager.mouseMoved();
		}
	};

	public in = () => {
		Globals.VIEW_MANAGER.addView(this.element);
		gsap.to(this.element, 0.5, { y: 0, ease: 'power1.out', onComplete: this.animatedIn });
		Globals.ACTIVE_VIEW = this;
		Globals.MAIN.showBackToDemos();
	};

	private animatedIn = () => {
		Globals.PAUSE_HAND_DETECTION = false;
		this.uiManager = new UIManager(this.element);
		this.inComplete();
	};

	public out = () => {
		gsap.to(this.element, 0.5, { y: -window.innerHeight, ease: 'power1.in', onComplete: this.outComplete });
		Globals.MAIN.hideBackToDemos();
	};

	kill() {
		super.kill();
	}
}
