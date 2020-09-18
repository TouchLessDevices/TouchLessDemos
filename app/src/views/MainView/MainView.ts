import { AbstractView } from '../core/AbstractView';
import { Globals } from '../../data/Globals';
import { gsap } from 'gsap';
import { UIManager } from '../../utils/UIManager';

import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';

export class MainView extends AbstractView {
	private uiManager: UIManager;
	private _backToDemosElement: HTMLDivElement;
	public element;

	constructor(element: HTMLElement, name: string, initial: boolean = false) {
		super(element, name, initial);
		this.element = element;
		this._backToDemosElement = document.querySelector('#backToDemos');
		gsap.set(this.element, { y: window.innerHeight });
	}

	public handLost = () => {
		if (this.uiManager) {
			this.uiManager.dragEnd();
		}
	};

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
				Globals.MAIN.showUseRightHandNotice();
				Globals.DOMCursor.changeToDefaultCursor(false, true);
			}
		} else if (Globals.HAND_STATE_MANAGER.getState() === 'grab') {
			Globals.MAIN.hideUseRightHandNotice();

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
			Globals.MAIN.hideUseRightHandNotice();

			Globals.IS_DRAGGING = false;
			if (this.uiManager) {
				this.uiManager.dragEnd();
			}
			Globals.DOMCursor.changeToDefaultCursor();
		}
	};

	public onRequestAnimationFrame = () => {
		if (this.uiManager) {
			if (Globals.HAND_STATE_MANAGER.getState() !== 'drag' && Globals.HAND_STATE_MANAGER.getState() !== 'palm') {
				this.uiManager.mouseMoved();
			}
			Globals.STORE_SCROLL_PERCENTAGE_IN_MAIN_VIEW = this.uiManager.getPercentageMoved();
		}
	};

	public in = () => {
		Globals.VIEW_MANAGER.addView(this.element);
		gsap.to(this.element, 0.5, { y: 0, ease: 'power1.out', onComplete: this.animatedIn });
		this.uiManager = new UIManager(this.element, Globals.STORE_SCROLL_PERCENTAGE_IN_MAIN_VIEW);
		Globals.ACTIVE_VIEW = this;
	};

	private animatedIn = () => {
		Globals.PAUSE_HAND_DETECTION = false;

		this.uiManager.showDragBar();
		this.uiManager.resize();
		this.inComplete();
	};

	public out = () => {
		Globals.PAUSE_HAND_DETECTION = true;
		gsap.to(this.element, 0.5, { y: window.innerHeight, ease: 'power1.in', onComplete: this.outComplete });
		if (this.uiManager) {
			this.uiManager.hideDragBar();

			this.uiManager.kill();
			this.uiManager = null;
		}
	};

	kill() {
		super.kill();
	}
}
