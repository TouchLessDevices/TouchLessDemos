import { AbstractView } from '../core/AbstractView';
import { Globals } from '../../data/Globals';
import { gsap } from 'gsap';
import { DOMCursor } from '../../utils/DOMCursor';
import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';

export class GestureView extends AbstractView {
	private DOMCursor: DOMCursor;
	public element;

	private handCircleElement: HTMLDivElement = document.querySelector('#handCircle');
	private circleGreenElement: SVGCircleElement = document.querySelector('#circleGreen');
	private circleRedElement: SVGCircleElement = document.querySelector('#circleRed');

	private percentageOfCircle = { green: 0, red: 0 };
	private circumference = 0;

	constructor(element: HTMLElement, name: string, initial: boolean = false) {
		super(element, name, initial);
		this.element = element;

		this.handCircleElement = element.querySelector('#handCircle');
		this.circleGreenElement = element.querySelector('#circleGreen');
		this.circleRedElement = element.querySelector('#circleRed');

		gsap.set(this.handCircleElement, { opacity: 0, ease: 'power1.easeIn' });

		var radius = this.circleGreenElement.r.baseVal.value;
		this.circumference = radius * 2 * Math.PI;
		this.circleGreenElement.style.strokeDasharray = '' + this.circumference + ', ' + this.circumference;
		this.circleGreenElement.style.strokeDashoffset = '' + this.circumference;
		this.circleRedElement.style.strokeDasharray = '' + this.circumference + ', ' + this.circumference;
		this.circleRedElement.style.strokeDashoffset = '' + this.circumference;

		gsap.set(this.element, { y: -window.innerHeight });
	}

	public handLost = () => {
		gsap.to(this.handCircleElement, 2, { opacity: 0, ease: 'power1.easeIn' });
		gsap.to(this.percentageOfCircle, 0.2, {
			red: 0,
			onUpdate: this.setCirclePercentage
		});
		gsap.to(this.percentageOfCircle, 0.2, {
			green: 0,
			onUpdate: this.setCirclePercentage
		});
	};

	public handFound = () => {
		if (this.handCircleElement.style.opacity === '0') {
			gsap.set(this.handCircleElement, { x: Globals.DOMCursor.pos.x, y: Globals.DOMCursor.pos.y - 150 });
		}
		gsap.killTweensOf(this.handCircleElement);
		gsap.to(this.handCircleElement, 0.2, { opacity: 1, ease: 'power1.easeOut' });
	};

	public reactToDOMCursor = (fingerPoseResults, result: Coords3D) => {
		var getHandRotation = Globals.HAND_ANALYZER.getHandRotation(result);
		var isPalmPointing = Globals.HAND_ANALYZER.isRightHandPalmPointingTowardsYourself(result);
		var isThumbUp = Globals.HAND_ANALYZER.isThumbsUp(fingerPoseResults, getHandRotation);

		if (isPalmPointing) {
			Globals.HAND_STATE_MANAGER.updateState('palm');
		} else if (isThumbUp) {
			var getThumbPos = result[4][1];
			var getPinkyPos = result[20][1];
			var difference = getPinkyPos - getThumbPos;
			console.log(difference);
			if (difference < -50) {
				Globals.HAND_STATE_MANAGER.updateState('thumbDown');
			} else if (difference > 50) {
				Globals.HAND_STATE_MANAGER.updateState('thumbUp');
			}
		} else {
			Globals.HAND_STATE_MANAGER.updateState(null);
		}

		console.log(Globals.HAND_STATE_MANAGER.getState());

		Globals.HAND_STATE_MANAGER.checkState();
		if (Globals.HAND_STATE_MANAGER.getState() === 'palm') {
			if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
				Globals.DOMCursor.changeToGoingBackToDemosCursor();
			}
		} else if (Globals.HAND_STATE_MANAGER.getState() === 'thumbUp') {
			if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
				gsap.to(this.circleGreenElement, 3, { stroke: 'green' });
				gsap.killTweensOf(this.percentageOfCircle);
				gsap.to(this.percentageOfCircle, 0.2, {
					red: 0,
					onUpdate: this.setCirclePercentage
				});
				gsap.to(this.percentageOfCircle, 3, {
					green: 100,
					onUpdate: this.setCirclePercentage
				});
			}
		} else if (Globals.HAND_STATE_MANAGER.getState() === 'thumbDown') {
			if (Globals.HAND_STATE_MANAGER.getStateCount() === 0) {
				gsap.to(this.circleRedElement, 1, { stroke: 'red' });
				gsap.killTweensOf(this.percentageOfCircle);
				gsap.to(this.percentageOfCircle, 3, {
					red: 100,
					onUpdate: this.setCirclePercentage
				});
				gsap.to(this.percentageOfCircle, 0.2, {
					green: 0,
					onUpdate: this.setCirclePercentage
				});
			}
		} else if (Globals.HAND_STATE_MANAGER.getState() === null) {
			//   gsap.to(this.circle, 1, {stroke: 'white'});
			gsap.killTweensOf(this.percentageOfCircle);
			gsap.to(this.percentageOfCircle, 0.2, {
				red: 0,
				onUpdate: this.setCirclePercentage
			});
			gsap.to(this.percentageOfCircle, 0.2, {
				green: 0,
				onUpdate: this.setCirclePercentage
			});
		}
	};

	private setCirclePercentage = () => {
		var offset: number = this.circumference - (this.percentageOfCircle.green / 100) * this.circumference;
		this.circleGreenElement.style.strokeDashoffset = '' + offset;

		var offset: number = this.circumference - (this.percentageOfCircle.red / 100) * this.circumference;
		this.circleRedElement.style.strokeDashoffset = '' + offset;
	};

	public onRequestAnimationFrame = () => {
		gsap.to(this.handCircleElement, 0.2, {
			x: Globals.DOMCursor.pos.x,
			y: Globals.DOMCursor.pos.y - 150,
			ease: 'none'
		});
	};

	public in = () => {
		Globals.VIEW_MANAGER.addView(this.element);
		gsap.to(this.element, 0.5, { y: 0, ease: 'power1.out', onComplete: this.inComplete });
		Globals.ACTIVE_VIEW = this;
		Globals.PAUSE_HAND_DETECTION = false;
	};

	public out = () => {
		gsap.to(this.element, 0.5, { y: -window.innerHeight, ease: 'power1.in', onComplete: this.outComplete });
	};

	kill() {
		super.kill();
	}
}
