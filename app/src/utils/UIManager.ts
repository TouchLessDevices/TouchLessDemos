import { TouchCard } from './TouchCard';
import { gsap } from 'gsap';
import { Globals } from '../data/Globals';

export class UIManager {
	private touchCards: TouchCard[] = [];

	private mainCategoryCards: TouchCard[] = [];

	private activeTouchCard: TouchCard = null;

	private _hasDraggedOverPercentageThreshold: boolean = false;
	private distanceMovedPos = { x: 0, y: 0, z: 0 };
	private startPos = { x: 0, y: 0, z: 0 };
	private elementPosition = { start: { x: 0, y: 0, z: 0 }, current: { x: 0, y: 0, z: 0 } };
	private cardContainer: HTMLDivElement;
	private _DOMCursorDragLine: HTMLDivElement;

	private _percentageBar: HTMLDivElement;

	private previousXPos: number = null;

	private _cardContainerWidth: number;

	private _objectPercentageMoved: number = 0;
	private _dragBarHiding: boolean = false;
	private _initialScrollPercentage: number = 0;

	private _hasDragged: boolean = false;

	constructor(element, initialScrollPercentage?: number) {
		this._initialScrollPercentage = initialScrollPercentage;
		this.cardContainer = element.querySelector('.cards');
		let cards = element.querySelectorAll('.TouchCard');
		cards.forEach((card, index) => {
			this.touchCards.push(new TouchCard(card as HTMLElement, this, index));
			this.mainCategoryCards.push(this.touchCards[index]);
		});

		this._DOMCursorDragLine = document.querySelector('#DOMCursorDragline');
		this._percentageBar = this._DOMCursorDragLine.querySelector('.percentageBar');

		this._percentageBar.style.width = 0 + 'px';
		this.hideDragBar();

		window.addEventListener('resize', this.resize);
		this.resize();
		console.log(this._initialScrollPercentage);
		if (this._initialScrollPercentage > 0) {
			var newXPos = this._cardContainerWidth * this._initialScrollPercentage * -1;
			var getPositionOnX = (this._cardContainerWidth * this._initialScrollPercentage) / this._cardContainerWidth;

			gsap.set(this._percentageBar, { ease: 'none', width: getPositionOnX * window.innerWidth });
			this.elementPosition.current.x = getPositionOnX * window.innerWidth;

			this._objectPercentageMoved = getPositionOnX;
			gsap.set(this.cardContainer, {
				ease: 'none',
				x: newXPos,
				onUpdate: this.dragStorePosition,
				onUpdateParams: [newXPos],
				force3D: true,
				onComplete: this.resize
			});

			this.previousXPos = newXPos;
		}
	}

	public mouseMoved = () => {
		for (let i = 0; i < this.mainCategoryCards.length; i++) {
			this.mainCategoryCards[i].updateMouseMove();
		}
	};

	public setActiveTouchCard = (card: TouchCard) => {
		this.activeTouchCard = card;
	};

	public dragStart = (x, y, z) => {
		Globals.IS_DRAGGING = true;

		this.distanceMovedPos.x = 0;
		this.distanceMovedPos.y = 0;
		this.distanceMovedPos.z = 0;
		this.startPos.x = x;
		this.startPos.y = y;
		this.startPos.z = z;
		this.elementPosition.start.x = Number(gsap.getProperty(this.cardContainer, 'x'));
		this.elementPosition.start.y = 0; //Number(gsap.getProperty(this._ringOnDragLine, 'y'));
		this.elementPosition.start.z = this.elementPosition.current.z;

		this._hasDraggedOverPercentageThreshold = false;
	};

	public dragMove = (x, y) => {
		if (this._hasDragged === true) {
			return;
		}

		this.distanceMovedPos.x = this.startPos.x - x;
		this.distanceMovedPos.y = this.startPos.y - y;
		//this.distanceMovedPos.z = this.startPos.z - z;

		// To avoid false positives - and to avoid to powerful drags, we are limiting the distance dragged
		/*	var maxX = window.innerWidth / 4;
		if (this.distanceMovedPos.x > maxX || this.distanceMovedPos.x < maxX) {
			this.distanceMovedPos.x = maxX;
		}*/

		//	console.log('this.elementPosition.start.x : ' + this.elementPosition.start.x)

		this.distanceMovedPos.x = this.distanceMovedPos.x * 2;

		var newXPos = this.distanceMovedPos.x + this.elementPosition.start.x;
		var newYPos = this.distanceMovedPos.y * -1 + this.elementPosition.start.y;

		if (newXPos > 0) {
			newXPos = 0;
		} else if (newXPos < this._cardContainerWidth * -1) {
			newXPos = this._cardContainerWidth * -1;
		}

		var dragDirectionRight = true;
		if (this.distanceMovedPos.x > 0) {
			dragDirectionRight = false;
		}
		var newDistancePos = this.distanceMovedPos.x;
		if (newDistancePos < 0) {
			newDistancePos = newDistancePos * -1;
		}

		if (newDistancePos > window.innerWidth / 2) {
			this._hasDragged = true;
			newXPos = this.elementPosition.current.x - window.innerWidth;
			//	console.log('this._cardContainerWidth : ' + this._cardContainerWidth);

			var newXPos = this.elementPosition.start.x + window.innerWidth;
			if (dragDirectionRight === true) {
				newXPos = this.elementPosition.start.x - window.innerWidth;
			}

			// Make sure we cant drag it out of bounds
			if (newXPos > 0) {
				newXPos = 0;
			} else if (newXPos < this._cardContainerWidth * -1) {
				newXPos = this._cardContainerWidth * -1;
			}

			gsap.to(this.cardContainer, 0.7, {
				delay: 0.0,
				ease: 'power1.inOut',
				x: newXPos,
				onUpdate: this.dragStorePosition,
				onUpdateParams: [newXPos, newYPos],
				force3D: true,
				onComplete: this.dragAnimationCompleted
			});

			var getPositionOnX = (newXPos * -1) / this._cardContainerWidth;

			//gsap.to(this._ringOnDragLine, 0.2, {delay: 0.2, ease: 'none', x: getPositionOnX * window.innerWidth * 0.75});
			gsap.to(this._percentageBar, 0.2, { delay: 0.2, ease: 'none', width: getPositionOnX * window.innerWidth });
			this.elementPosition.current.x = getPositionOnX * window.innerWidth;

			this._objectPercentageMoved = getPositionOnX;

			//this.dragEnd();

			this.previousXPos = newXPos;
		}
	};

	private dragAnimationCompleted = () => {
		this.elementPosition.start.x = Number(gsap.getProperty(this.cardContainer, 'x'));
		this.distanceMovedPos.x = 0;
		this.startPos.x = window.innerWidth - Globals.DOMCursor.pos.x;
		this._hasDragged = false;

		this.dragEnd();
		this.resize();
	};

	public dragEnd() {
		//gsap.to(this._DOMCursorDragLine, 0.2, { opacity: 0 });
		if (this._dragBarHiding === false) {
			//	gsap.to(this._DOMCursorDragLine, 0.6, { y: 0, ease: 'power1.in' });
		}
		//	console.log('dragEnd');
		this._hasDraggedOverPercentageThreshold = false;

		//gsap.to(this._ringOnDragLine, 0.2, {scale: 1});

		for (var i = 0; i < this.touchCards.length; i++) {
			var currentCard = this.touchCards[i];
			gsap.to(currentCard.getElement(), 0.2, { ease: 'power1.inOut', scale: 1 });
		}

		// Trigger resize in order to figure out where touchcards are placed
		this.resize();
		Globals.IS_DRAGGING = false;
	}

	public resize = (event?) => {
		if (this.cardContainer) {
			this._cardContainerWidth = this.cardContainer.offsetWidth - window.innerWidth;
		}
		for (var i = 0; i < this.touchCards.length; i++) {
			var currentCard = this.touchCards[i];
			currentCard.resize();
		}
	};

	private dragStorePosition = (x, y) => {
		this.elementPosition.current.x = x;
		this.elementPosition.current.y = y;
		//this.resize();
	};

	public getPercentageMoved() {
		return this._objectPercentageMoved;
	}

	public hideDragBar() {
		this._dragBarHiding = true;
		gsap.to(this._DOMCursorDragLine, 0.2, { y: 10, ease: 'power1.in' });
	}

	public showDragBar() {
		this._dragBarHiding = false;
		gsap.to(this._DOMCursorDragLine, 0.2, { y: 0, ease: 'power1.out' });
	}

	public kill() {
		window.removeEventListener('resize', this.resize);
	}
}
