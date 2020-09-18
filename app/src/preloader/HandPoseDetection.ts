import { Globals } from '../data/Globals';
import * as comlink from 'comlink';
import { ActiveStateController } from '../utils/ActiveStateController';

export class HandPoseDetection {
	private _offscreen: OffscreenCanvas;
	private _offCtx: CanvasRenderingContext2D;
	private _predictions;
	private _predictionCount: number = 0;
	private _firstPrediction: boolean = false;
	private _successCallback: Function;
	private _userFeedVideo: HTMLVideoElement;

	constructor(successCallback: Function, userFeedVideo) {
		this._successCallback = successCallback;
		this._userFeedVideo = userFeedVideo;
		this.loadHandPose();
	}

	private loadHandPose = () => {
		console.log('loadHandPose');
		var parent = this;
		var comlinkApi;

		const canvas = document.createElement('canvas') as HTMLCanvasElement;
		canvas.width = Globals.VIDEO_WIDTH;
		canvas.height = Globals.VIDEO_HEIGHT;

		const offscreenCanvas = canvas.transferControlToOffscreen();

		this._offscreen = new OffscreenCanvas(Globals.VIDEO_WIDTH, Globals.VIDEO_HEIGHT);
		this._offCtx = this._offscreen.getContext('2d') as any;

		async function setupWorker() {
			console.log('setupworker');
			// setup comlink
			const worker = new Worker('./../worker.ts', { type: 'module' });
			comlinkApi = await comlink.wrap(worker);
			await comlinkApi.init(comlink.transfer(offscreenCanvas, [offscreenCanvas as any]));
			Globals.ACTIVE_STATE_CONTROLLER = new ActiveStateController();

			await predict();
		}

		let workerSetup = setupWorker();

		async function predict() {
			var allowPredict = true;

			if (Globals.PAUSE_HAND_DETECTION === true) {
				allowPredict = false;
			}
			if (Globals.ACTIVE_STATE_CONTROLLER.pageVisible === false) {
				allowPredict = false;
			}
			Globals.MAIN.statsHandTracking.begin();

			if (allowPredict === true) {
				parent._offCtx.drawImage(parent._userFeedVideo, 0, 0);
				const bitmap = parent._offscreen.transferToImageBitmap();
				parent._predictions = await comlinkApi.update(comlink.transfer(bitmap, [bitmap as any]));
				//	console.log(parent._predictions);

				if (parent._predictions[0]) {
					parent._predictions = parent._predictions[0];
				}

				if (parent._predictionCount === 2) {
					parent._firstPrediction = false;
					parent._successCallback();
				}
				parent._predictionCount++;
				//	console.log(parent._predictions);
				if (parent._predictions && parent._predictions.landmarks && parent._predictions.handInViewConfidence > 0.8) {
					// Recalculate all landmarks to fit witnin the videos bounds
					var landmarks = parent._predictions.landmarks;
					var length = landmarks.length;
					for (var i = 0; i < length; i++) {
						var currentLandmark = landmarks[i];
						// FIXME - move calcs to globals
						// FIX ME - these calcs needs to be corrected
						currentLandmark[0] = Globals.VIDEO_WIDTH_CROP * 0.92 - Number(currentLandmark[0]);
						currentLandmark[1] = currentLandmark[1] - Globals.VIDEO_HEIGHT * 0.02;
					}

					//.log(Globals.VIDEO_WIDTH_CROP * 0.9);
					//console.log('currentLandmark[0] :' + landmarks[9][0]);
					Globals.DOMCursor.handFound(parent._predictions.landmarks, parent._predictions);
				} else {
					Globals.DOMCursor.noHandFound();
				}
			}
			Globals.MAIN.statsHandTracking.end();
			requestAnimationFrame(predict);
		}
	};
}
