import { AbstractView } from '../core/AbstractView';
import { Globals } from '../../data/Globals';
import { gsap } from 'gsap';
import { DOMCursor } from '../../utils/DOMCursor';
import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';
import { UIManager } from '../../utils/UIManager';

export class RestaurantOrderingView extends AbstractView {
	private uiManager: UIManager;
	public element;

	private _introSection: HTMLDivElement;
	private _demoSection: HTMLDivElement;
	private _endScreen: HTMLDivElement;
	private _orderCards;
	private _checkoutText: HTMLDivElement;
	private _checkoutButtonBG: HTMLDivElement;
	private _totalCostText;

	private _currentCost: any = { count: 0 };

	constructor(element: HTMLElement, name: string, initial: boolean = false) {
		super(element, name, initial);
		this.element = element;

		this._introSection = this.element.querySelector('.introScreen');
		this._demoSection = this.element.querySelector('.demoScreen');
		this._endScreen = this.element.querySelector('.endScreen');
		this._totalCostText = this._endScreen.querySelector('.totalCost');

		this._orderCards = this._demoSection.querySelectorAll('.TouchCard');

		this._checkoutText = this._demoSection.querySelector('.checkoutText');

		this._checkoutButtonBG = this._demoSection.querySelector('.checkoutButtonBG');

		gsap.set(this.element, { y: -window.innerHeight });
		gsap.set(this._orderCards, { z: -500, rotationY: -45, opacity: 0.0, transformOrigin: '50% 50%' });
	}

	public touchCardCallback = actionType => {
		console.log('actionType : ' + actionType);
		var buyCost = actionType.split('-');
		var isBuy = false;
		console.log(isBuy);
		if (buyCost.length > 1) {
			isBuy = true;
		} else {
			isBuy = false;
		}

		console.log(isBuy);

		if (actionType === 'startDemo') {
			console.log('**** startDemo');
			gsap.to(this._introSection, 0.3, { autoAlpha: 0, onComplete: this.removeIntroScreen });
			this._demoSection.style.display = 'block';
			this._demoSection.style.opacity = '0';
			gsap.to(this._demoSection, 0.3, { autoAlpha: 1 });
			gsap.to(this._orderCards, 0.4, { delay: 0.3, z: 0, rotationY: 0, opacity: 1, ease: 'power1.inOut', onComplete: this.uiManager.resize });
		} else if (actionType === 'checkout') {
			this.checkoutSelected();
		} else if (isBuy) {
			var price = buyCost[1];
			console.log('price . ' + price);
			this.addToOrder(Number(price));
		}
	};

	private addToOrder = cost => {
		gsap.to(this._checkoutButtonBG, 0.2, { backgroundColor: Globals.COLOR_BLUE });
		gsap.to(this._checkoutButtonBG, 0.2, { delay: 0.4, backgroundColor: 'rgba(0, 0, 0, 0.5)' });

		gsap.to(this._currentCost, 0.4, { count: this._currentCost.count + cost, onUpdate: this.updateCost });
	};
	private updateCost = () => {
		var newCost = Math.round(this._currentCost.count);
		this._checkoutText.innerHTML = 'Checkout ' + newCost + '$';

		this._totalCostText.innerHTML = newCost;
	};
	private removeIntroScreen = () => {
		this._introSection.style.display = 'none';
		this.uiManager.resize();
	};

	private checkoutSelected() {
		for (var i = 0; i < this._orderCards.length; i++) {
			var currentSmiley = this._orderCards[i];
			var delay = 0.0;

			gsap.to(currentSmiley, 0.5, { ease: 'power1.inOut', z: -200, delay: delay, rotationY: -45, opacity: 0.3 });
		}
		gsap.set(this._endScreen, { y: -10 });
		gsap.to(this._endScreen, 0.5, { y: 0, autoAlpha: 1, ease: 'power1.in' });

		gsap.delayedCall(2, this.showOrderButtonsAgain);
	}

	private showOrderButtonsAgain = () => {
		gsap.to(this._endScreen, 0.3, { autoAlpha: 0, y: 10, ease: 'power1.in', onComplete: this.resetCost });
		gsap.to(this._orderCards, 0.4, { delay: 0.3, z: 0, rotationY: 0, opacity: 1, ease: 'power1.inOut' });
	};

	private resetCost = () => {
		this._totalCostText.innerHTML = 0;
		this._checkoutText.innerHTML = 'Checkout ' + 0 + '$';
		this._currentCost.count = 0;
	};

	public handLost = () => {
		if (this.uiManager) {
			this.uiManager.dragEnd();
		}
	};

	public handFound = () => {};

	public reactToDOMCursor = (fingerPoseResults, result: Coords3D) => {
		var isGrabbing = Globals.HAND_ANALYZER.isGrabbing(fingerPoseResults);
		var isPalmPointing = Globals.HAND_ANALYZER.isRightHandPalmPointingTowardsYourself(result);

		if (isPalmPointing) {
			Globals.HAND_STATE_MANAGER.updateState('palm');
		} else if (isGrabbing >= 2) {
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
			Globals.IS_DRAGGING = true;
			if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
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
			Globals.IS_DRAGGING = false;
			if (this.uiManager) {
				this.uiManager.dragEnd();
			}
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
		this.uiManager.showDragBar();
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
