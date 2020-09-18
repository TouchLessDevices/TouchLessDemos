import * as comlink from 'comlink';
//Made this duplicated class file to override the urls, in order to load it locally instead:

import * as handpose from '@tensorflow-models/handpose';
import { Globals } from '../app/src/data/Globals';

let net: handpose.HandPose | null = null;
let ctx: CanvasRenderingContext2D | null = null;

// video buffer
const videoBufferCanvas = new OffscreenCanvas(Globals.VIDEO_WIDTH, Globals.VIDEO_HEIGHT);
const videoBufferContext = (videoBufferCanvas.getContext('2d') as any) as CanvasRenderingContext2D;

console.time('[worker] start');

comlink.expose({
  async init(canvas: OffscreenCanvas) {
    console.time('[worker] load-model');
    /*      maxContinuousChecks - How many frames to go without running the bounding box detector. Defaults to infinity. Set to a lower value if you want a safety net in case the mesh detector produces consistently flawed predictions.
        detectionConfidence - Threshold for discarding a prediction. Defaults to 0.8.
        iouThreshold - A float representing the threshold for deciding whether boxes overlap too much in non-maximum suppression. Must be between [0, 1]. Defaults to 0.3.
        scoreThreshold - A threshold for deciding when to remove boxes based on score in non-maximum suppression. Defaults to 0.75.*/
    net = await handpose.load({ detectionConfidence: 0.1 } /*{maxContinuousChecks: 15, detectionConfidence: 0, iouThreshold: 0, scoreThreshold: 0}*/);
    console.timeEnd('[worker] load-model');
    ctx = canvas.getContext('2d') as any;
    console.time('[worker] ready');
  },
  async update(bitmap: ImageBitmap, updateWebcam = true, confidence = 0.7) {
    if (net != null && ctx) {
      videoBufferContext.drawImage(bitmap, 0, 0);
      if (updateWebcam) {
        //  ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        ctx.drawImage(bitmap, 0, 0);
      }
      //  console.time('handpose')

      const predictions = await net.estimateHands(videoBufferCanvas as any);
      //   console.timeEnd('handpose')

      if (predictions.length > 0 && predictions[0].handInViewConfidence > 0) {
        if (updateWebcam) {
          //     drawKeypoints(ctx, predictions[0].landmarks);
        }
      }
      return predictions;
    }
  }
});
