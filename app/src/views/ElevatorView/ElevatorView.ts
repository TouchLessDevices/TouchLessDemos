import { AbstractView } from '../core/AbstractView';
import { Globals } from '../../data/Globals';
import { gsap } from 'gsap';
import { DOMCursor } from '../../utils/DOMCursor';
import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';
import { UIManager } from '../../utils/UIManager';

export class ElevatorView extends AbstractView {
	private uiManager: UIManager;
	public element;

	private _introSection: HTMLDivElement;
	private _demoSection: HTMLDivElement;
	private _floors: HTMLDivElement;
	private _floorArrow: HTMLDivElement;
	private _floorCards;

	private _previousFloor: number = 0;

	constructor(element: HTMLElement, name: string, initial: boolean = false) {
		super(element, name, initial);
		this.element = element;

		this._introSection = this.element.querySelector('.introScreen');
		this._demoSection = this.element.querySelector('.demoScreen');

		this._floorCards = this._demoSection.querySelectorAll('.TouchCard');
		this._floors = this._demoSection.querySelector('.floors');
		this._floorArrow = this._demoSection.querySelector('.arrow');

		gsap.set(this.element, { y: -window.innerHeight });
		gsap.set(this._floorCards, { z: -500, rotationY: 15, opacity: 0.0, transformOrigin: '50% 50%' });
	}

	public touchCardCallback = actionType => {
		console.log('actionType : ' + actionType);
		if (actionType === 'startDemo') {
			gsap.to(this._introSection, 0.3, { autoAlpha: 0, onComplete: this.hideIntroScreen });
			this._demoSection.style.display = 'block';
			this._demoSection.style.opacity = '0';
			gsap.to(this._demoSection, 0.3, { autoAlpha: 1 });
			gsap.to(this._floorCards, 0.4, { delay: 0.3, z: 0, rotationY: 0, opacity: 1, ease: 'power1.inOut', onComplete: this.uiManager.resize });
		} else if (actionType === 'floor0') {
			this.floorSelected(0);
		} else if (actionType === 'floor1') {
			this.floorSelected(1);
		} else if (actionType === 'floor2') {
			this.floorSelected(2);
		} else if (actionType === 'floor3') {
			this.floorSelected(3);
		} else if (actionType === 'floor4') {
			this.floorSelected(4);
		} else if (actionType === 'floor5') {
			this.floorSelected(5);
		}
	};

	private hideIntroScreen = () => {
		this._introSection.style.display = 'none';
		this.uiManager.resize();
	};

	private floorSelected(floorSelected) {
		if (this._previousFloor > floorSelected) {
			gsap.set(this._floorArrow, { rotation: 180 });
		} else {
			gsap.set(this._floorArrow, { rotation: 0 });
		}

		gsap.to(this._floors, 2, { ease: 'power1.inOut', y: -223 * floorSelected });
		this._previousFloor = floorSelected;
	}

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
