import { AbstractView } from '../core/AbstractView';
import { Globals } from '../../data/Globals';
import { gsap } from 'gsap';
import { UIManager } from '../../utils/UIManager';

import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';

export class TutorialView extends AbstractView {
	private uiManager: UIManager;

	private _instructionTextRaiseHand: HTMLDivElement;
	private _instructionTextDrag: HTMLDivElement;
	private _instructionTextPinch: HTMLDivElement;
	private _cards: HTMLDivElement;

	private _introStep: number = 0;

	private _pauseHandReactions: boolean = false;

	public element;

	constructor(element: HTMLElement, name: string, initial: boolean = false) {
		super(element, name, initial);
		this.element = element;

		this._instructionTextRaiseHand = this.element.querySelector('.instructionText.handUp');
		this._instructionTextDrag = this.element.querySelector('.instructionText.dragIntoView');
		this._instructionTextPinch = this.element.querySelector('.instructionText.pinchToStart');
		this._cards = this.element.querySelector('.cards');

		Globals.PAUSE_HAND_DETECTION = false;
		gsap.set(this.element, { autoAlpha: 0 });
	}

	public stepOneDone = () => {
		this._pauseHandReactions = false;
		this.uiManager = new UIManager(this.element);
		this.uiManager.showDragBar();
	};

	public stepTwoDone = () => {
		this._pauseHandReactions = false;
		this.uiManager.hideDragBar();
	};

	public reactToDOMCursor = (fingerPoseResults, result: Coords3D) => {
		//	console.log('this._pauseHandReactions ; : ' + this._pauseHandReactions);
		if (this._pauseHandReactions !== true) {
			var isPalmPointing = Globals.HAND_ANALYZER.isRightHandPalmPointingTowardsYourself(result);
			if (isPalmPointing) {
				Globals.HAND_STATE_MANAGER.updateState('palm');
			}

			if (this._introStep === 0) {
				this._pauseHandReactions = true;
				this._introStep = 1;

				// Hide
				gsap.to(this._instructionTextRaiseHand, 0.5, { autoAlpha: 0 });

				// Show
				gsap.to(this._cards, 0.5, { delay: 0.5, autoAlpha: 1 });
				gsap.to(this._instructionTextDrag, 0.5, { delay: 0.5, autoAlpha: 1, onComplete: this.stepOneDone });

				if (Globals.HAND_STATE_MANAGER.getState() === 'palm') {
					if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
						Globals.MAIN.showUseRightHandNotice();
					}
				} else {
					Globals.MAIN.hideUseRightHandNotice();
				}
			}

			// Grab
			if (this._introStep === 1) {
				var isGrabbing = Globals.HAND_ANALYZER.isGrabbing(fingerPoseResults);

				if (isGrabbing >= 2) {
					Globals.HAND_STATE_MANAGER.updateState('grab');
				} else {
					Globals.HAND_STATE_MANAGER.updateState(null);
				}

				Globals.HAND_STATE_MANAGER.checkState();

				if (Globals.HAND_STATE_MANAGER.getState() === 'palm') {
					if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
						Globals.DOMCursor.changeToDefaultCursor(false, true);
						Globals.MAIN.showUseRightHandNotice();
					}
				} else if (Globals.HAND_STATE_MANAGER.getState() === 'grab') {
					Globals.MAIN.hideUseRightHandNotice();
					Globals.IS_DRAGGING = true;
					if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
						console.log('dragstart');
						Globals.DOMCursor.changeToDragCursor();
						if (this.uiManager) {
							this.uiManager.dragStart(window.innerWidth - Globals.DOMCursor.pos.x, Globals.DOMCursor.pos.y, 0);
						}
					} else {
						if (this.uiManager) {
							this.uiManager.dragMove(window.innerWidth - Globals.DOMCursor.pos.x, Globals.DOMCursor.pos.y);
						}
					}
				} else if (Globals.HAND_STATE_MANAGER.getState() === null && Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
					Globals.MAIN.hideUseRightHandNotice();

					Globals.IS_DRAGGING = false;
					if (this.uiManager) {
						this.uiManager.dragEnd();
					}

					Globals.DOMCursor.changeToDefaultCursor();
				}
			} else if (this._introStep === 2) {
				Globals.HAND_STATE_MANAGER.updateState(null);
				//	}

				Globals.HAND_STATE_MANAGER.checkState();

				if (Globals.HAND_STATE_MANAGER.getState() === null) {
					if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
						Globals.DOMCursor.changeToDefaultCursor();
					}
				}
			}
		}
	};

	public handLost = () => {
		if (this.uiManager) {
			this.uiManager.dragEnd();
		}
	};

	public onRequestAnimationFrame = () => {
		if (this.uiManager && this._introStep === 2) {
			//	console.log('moved')
			if (Globals.HAND_STATE_MANAGER.getState() !== 'drag' && Globals.HAND_STATE_MANAGER.getState() !== 'palm') {
				this.uiManager.mouseMoved();
			}
		}

		if (this._pauseHandReactions !== true && this._introStep === 1) {
			// Check to see if element is dragged into place
			var getPercentageMoved = this.uiManager.getPercentageMoved();
			//	console.log('getPercentageMoved : ' + getPercentageMoved);
			if (getPercentageMoved > 0.9) {
				this._pauseHandReactions = true;
				this.uiManager.dragEnd();
				Globals.IS_DRAGGING = false;
				this._introStep = 2;

				Globals.DOMCursor.changeToDefaultCursor();

				gsap.to(this._instructionTextDrag, 0.5, { delay: 0.5, autoAlpha: 0 });

				gsap.to(this._instructionTextPinch, 0.5, { delay: 0.5, autoAlpha: 1, onComplete: this.stepTwoDone });
			}
		}
	};

	public in = () => {
		Globals.ACTIVE_VIEW = this;
		Globals.VIEW_MANAGER.addView(this.element);
		gsap.to(this.element, 0.5, { autoAlpha: 1, ease: 'power1.in', onComplete: this.inComplete });
	};

	public out = () => {
		Globals.PAUSE_HAND_DETECTION = true;
		gsap.to(this._cards, 0.5, { x: -window.innerWidth, overwrite: true });
		gsap.to(this.element, 0.5, { y: window.innerHeight * -1, ease: 'power1.in', onComplete: this.outComplete });
		Globals.MAIN.hideBackToDemos();
	};

	kill() {
		super.kill();
	}
}
