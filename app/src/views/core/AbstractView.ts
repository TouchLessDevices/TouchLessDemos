import { gsap } from 'gsap';
import { View } from './IView';
import { Globals } from '../../data/Globals';
import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';

export class AbstractView implements View {
	protected element: HTMLElement;
	public name: string;
	public modules = new Map();
	public initial: boolean;

	constructor(element: HTMLElement, name: string, initial: boolean = false) {
		this.name = name;
		this.element = element;
		this.initial = initial;
	}

	public in() {
		Globals.VIEW_MANAGER.addView(this.element);
		gsap.to(this.element, 0.5, { opacity: 1, onComplete: this.inComplete, overwrite: true });
	}

	public inComplete() {
		Globals.VIEW_MANAGER.allowNextView();
	}

	public out() {
		gsap.to(this.element, 0.5, { opacity: 0, onComplete: this.outComplete, overwrite: true });
	}

	public outComplete = () => {
		this.kill();
		Globals.VIEW_MANAGER.allowNextView();
	};

	public resize() {
		this.modules.forEach(mod => {
			mod.resize();
		});
	}
	public handFound() {}

	public handLost() {}

	public reactToDOMCursor(fingerPoseResults, result: Coords3D) {}

	public onRequestAnimationFrame() {}

	public kill() {
		Globals.VIEW_MANAGER.removeView(this.element);

		this.modules.forEach(module => {
			module.kill();
		});
	}
}
