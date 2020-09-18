import * as comlink from 'comlink';
import { Globals } from './data/Globals';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { HandPose } from '@tensorflow-models/handpose';
import '@tensorflow/tfjs-backend-cpu';

let net: HandPose | null = null;

// We divide the Width by 1.5 - since we dont want the full Canvas area to be detected
const videoBufferCanvas = new OffscreenCanvas(Globals.VIDEO_WIDTH_CROP, Globals.VIDEO_HEIGHT);
const videoBufferContext = (videoBufferCanvas.getContext('2d') as any) as CanvasRenderingContext2D;

comlink.expose({
	async init(canvas: OffscreenCanvas) {
		await tf.setBackend('webgl');
		await tf.ready();
		/*      maxContinuousChecks - How many frames to go without running the bounding box detector. Defaults to infinity. Set to a lower value if you want a safety net in case the mesh detector produces consistently flawed predictions.
        detectionConfidence - Threshold for discarding a prediction. Defaults to 0.8.
        iouThreshold - A float representing the threshold for deciding whether boxes overlap too much in non-maximum suppression. Must be between [0, 1]. Defaults to 0.3.
        scoreThreshold - A threshold for deciding when to remove boxes based on score in non-maximum suppression. Defaults to 0.75.*/
		net = await handpose.load({ detectionConfidence: 0.6 } /*{maxContinuousChecks: 15, detectionConfidence: 0, iouThreshold: 0, scoreThreshold: 0}*/);
	},
	async update(bitmap: ImageBitmap) {
		if (net != null) {
			videoBufferContext.drawImage(bitmap, 0, 0);
			const predictions = await net.estimateHands(videoBufferCanvas as any);
			return predictions;
		}
	}
});
