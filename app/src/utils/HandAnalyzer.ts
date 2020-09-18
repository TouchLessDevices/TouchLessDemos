import { Finger, FingerCurl, FingerDirection } from './FingerDescription';
import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';
import { Globals } from '../data/Globals';

export class HandAnalyzer {
	public getHandRotation(landmarks: Coords3D) {
		// Calculate the rotation based on the base and the palm
		let handRotation = (Math.atan2(landmarks[0][1] - landmarks[9][1], landmarks[0][0] - landmarks[9][0]) * 180) / Math.PI - 90;
		return -handRotation;
	}

	public getHandZPosition(landmarks: Coords3D) {
		// base = [0]
		// thumb = [0]
		// FIXME - This distance needs to be done in relation to the video feeds width and height
		let zPosition = Math.hypot(landmarks[0][0] - landmarks[1][0], landmarks[0][1] - landmarks[1][1]);

		// We set that a distance between the palm and base base value is 30 = 1
		zPosition = zPosition / 30;
		return zPosition;
	}

	public getFingerSpread(fingerPoseResults, landmarks: Coords3D) {
		let indexFirstPos = landmarks[5];
		let middleFirstPos = landmarks[9];
		let ringFirstPos = landmarks[13];
		let pinkyFirstPos = landmarks[17];

		let index = landmarks[6];
		let middle = landmarks[10];
		let ring = landmarks[14];
		let pinky = landmarks[18];

		return {
			indexToMiddle: this.findDistanceBetweenTwoLandMarks(index, middle),
			middleToRing: this.findDistanceBetweenTwoLandMarks(middle, ring),
			ringToPinky: this.findDistanceBetweenTwoLandMarks(ring, pinky),
			indexToPinky: this.findDistanceBetweenTwoLandMarks(index, pinky) - this.findDistanceBetweenTwoLandMarks(indexFirstPos, pinkyFirstPos)
		};
	}

	public findDistanceBetweenThreeDLandMarks(landmarkA, landmarkB) {
		let a = landmarkA[0] - landmarkB[0];
		let b = landmarkA[1] - landmarkB[1];
		let c = landmarkA[2] - landmarkB[2];

		return Math.sqrt(a * a + b * b + c * c);
	}

	public findDistanceBetweenTwoLandMarks(landmarkA, landmarkB) {
		let a = landmarkA[0] - landmarkB[0];
		let b = landmarkA[1] - landmarkB[1];

		return Math.sqrt(a * a + b * b);
	}

	public isClicking(fingerPoseResults, landmarks, handRotation) {
		// FIXME: Normalize values so distance etc doesnt care about what the video input size is. Maybe always resize the video to 100px width?
		// New way of detecting click - look at if the thumb and pointer angle are close to each other
		let isClicking = false;
		let thumbAngle = fingerPoseResults.directions[0].angle - 90 - handRotation;
		let pointerAngle = fingerPoseResults.directions[1].angle - 90 - handRotation;

		let thumbAndPointerAngleDistance = thumbAngle - pointerAngle;
		if (thumbAndPointerAngleDistance < 0) {
			thumbAndPointerAngleDistance = thumbAndPointerAngleDistance * -1;
		}
		if (pointerAngle < 0) {
			pointerAngle = pointerAngle * -1;
		}

		// Lets also get the distance between the thumb and the index fingers
		let thumbAndPointerDistance = this.findDistanceBetweenTwoLandMarks(landmarks[4], landmarks[8]);
		if (thumbAndPointerDistance < 50) {
			isClicking = true;
		}
		if (pointerAngle > 20 && thumbAndPointerAngleDistance < 30) {
			//	isClicking = true;
		}

		//	console.log('thumbAndPointerDistance : ' + thumbAndPointerDistance);
		//	console.log('pointerAngle : ' + pointerAngle);

		// If any of the fingers (except the pointer) are "curling" we ignore the click
		if (
			fingerPoseResults.curls[2].fingerCurl >= FingerCurl.HalfCurl ||
			fingerPoseResults.curls[3].fingerCurl >= FingerCurl.HalfCurl ||
			fingerPoseResults.curls[4].fingerCurl >= FingerCurl.HalfCurl
		) {
			isClicking = false;
		}
		return isClicking;
	}

	public isGrabbing(fingerPoseResults) {
		let customCurl = 1; //FingerCurl.FullCurl;
		customCurl = 100;
		let grabCount = 0;
		if (fingerPoseResults.curls[1].angle <= customCurl) {
			grabCount += 1;
		}
		if (fingerPoseResults.curls[2].angle <= customCurl) {
			grabCount += 1;
		}
		if (fingerPoseResults.curls[3].angle <= customCurl) {
			grabCount += 1;
		}
		if (fingerPoseResults.curls[4].angle <= customCurl) {
			grabCount += 1;
		}

		return grabCount;
	}

	public isRightHandPalmPointingTowardsYourself(landmarks: Coords3D) {
		var isPoitingTowardsYourself = false;
		var getThumbPos = landmarks[4][0];
		var getPinkyPos = landmarks[20][0];
		var difference = getThumbPos - getPinkyPos;
		if (difference > 40) {
			isPoitingTowardsYourself = true;
		}

		Globals.RIGHT_PALM_POINTING = isPoitingTowardsYourself;
		return isPoitingTowardsYourself;
	}

	public isThumbsUp(fingerPoseResults, handRotation) {
		let thumpUp = false;

		var customCurl = 100;
		let grabCount = 0;
		if (fingerPoseResults.curls[1].angle <= customCurl) {
			grabCount += 1;
		}
		if (fingerPoseResults.curls[2].angle <= customCurl) {
			grabCount += 1;
		}
		if (fingerPoseResults.curls[3].angle <= customCurl) {
			grabCount += 1;
		}
		if (fingerPoseResults.curls[4].angle <= customCurl) {
			grabCount += 1;
		}

		if (grabCount >= 3) {
			thumpUp = true;
		}
		return thumpUp;
	}
}
