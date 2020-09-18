import { pointIntersectsRect } from './UIHelpers';
import { UIManager } from './UIManager';
import { gsap } from 'gsap';
import { Globals } from '../data/Globals';

export class TouchCard {
	private halfWidth: number;
	private halfHeight: number;
	private offsetLeft: number;
	private offsetTop: number;
	private boundingClientRect: DOMRect;

	private hovered = false;
	private clicked: boolean = false;
	private _uiManager: UIManager;
	private index: number;

	private _line: HTMLDivElement;
	private _background: HTMLDivElement;
	private _domElement: HTMLElement;
	private _videoElement: HTMLVideoElement;

	private _linksToPath: string;
	private _actionType: string;

	constructor(domElement: HTMLElement, uiManager: UIManager, index: number) {
		this.index = index;
		this._domElement = domElement;

		this._line = this._domElement.querySelector('.line');
		this._background = this._domElement.querySelector('.background');
		this._videoElement = this._domElement.querySelector('video');
		this._uiManager = uiManager;

		this._linksToPath = this._domElement.getAttribute('data-path');
		this._actionType = this._domElement.getAttribute('data-action');
		this.resize();
		this._domElement.addEventListener('pointerdown', this.click);
		window.addEventListener('resize', this.resize);
	}

	public resize = () => {
		this.halfWidth = this._domElement.clientWidth / 2;
		this.halfHeight = this._domElement.clientHeight / 2;
		this.boundingClientRect = this._background.getBoundingClientRect();

		this.offsetLeft = this.boundingClientRect.left;
		this.offsetTop = this.boundingClientRect.top;
	};

	public updateMouseMove = () => {
		if (
			this._linksToPath !== '' &&
			Globals.HAND_STATE_MANAGER.handFound() === true &&
			Globals.IS_DRAGGING === false &&
			Globals.RIGHT_PALM_POINTING === false &&
			pointIntersectsRect(Globals.DOMCursor.pos, this.boundingClientRect)
		) {
			if (!this.hovered) {
				this.hovered = true;
				gsap.to(this._background, 0.4, { borderColor: Globals.COLOR_BLUE, scale: 1.1 });

				if (this._videoElement) {
					this._videoElement.play();
				}
			}
			if (Globals.FINGER_SPREAD > Globals.FINGER_SPREAD_NEEDED_FOR_CLICK && Globals.HAND_STATE_MANAGER.getState() === null) {
				if (this.clicked === false) {
					this.clicked = true;
					gsap.to(this._line, 1.6, { ease: 'none', width: '100%', onComplete: this.click });
				}
			} else {
				this.clicked = false;
				gsap.killTweensOf(this._line);
				gsap.to(this._line, 0.15, { width: '0px' });
			}
			let coorX = this.halfWidth - (Globals.DOMCursor.pos.x - this.offsetLeft);
			let coorY = this.halfHeight - (Globals.DOMCursor.pos.y - this.offsetTop);

			let degX = (coorY / this.halfWidth) * 1 + 'deg';
			let degY = (coorX / this.halfHeight) * -1 + 'deg';

			gsap.to(this._domElement, 0.2, { rotateX: degX, rotateY: degY, overwrite: 'auto' });

			this._uiManager.setActiveTouchCard(this);
		} else if (this.hovered) {
			if (this._videoElement) {
				this._videoElement.pause();
			}
			this.hovered = false;
			this.clicked = false;

			gsap.to(this._background, 0.4, { borderColor: Globals.COLOR_DARK_GREY, scale: 1 });
			gsap.killTweensOf(this._line);
			gsap.to(this._line, 0.3, { width: '0px', backgroundColor: Globals.COLOR_BLUE });

			return;
		}
	};

	public click = () => {
		gsap.to(this._background, 0.4, { borderColor: '#ffffff' });
		gsap.to(this._line, 0.4, { backgroundColor: '#ffffff' });

		var checkForPathOrAction = this._linksToPath;
		console.log(Globals.ACTIVE_VIEW.touchCardCallback);
		console.log(checkForPathOrAction);
		console.log(this._actionType);
		if (this._actionType === 'path') {
			Globals.VIEW_MANAGER.setPath(checkForPathOrAction);
		} else if (this._actionType === 'callback') {
			Globals.ACTIVE_VIEW.touchCardCallback(checkForPathOrAction);
		}
	};

	public getElement() {
		return this._domElement;
	}
}
