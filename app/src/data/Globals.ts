import { ViewManager } from '../managers/ViewManager';
import { DOMCursor } from '../utils/DOMCursor';
import { HandAnalyzer } from '../utils/HandAnalyzer';
import { HandStateManager } from '../utils/HandStateManager';
import { Preloader } from '../preloader/Preloader';
import { SetupVideo } from '../preloader/SetupVideo';
import { ActiveStateController } from '../utils/ActiveStateController';

export class Globals {
	public static DEBUG: boolean = false;
	public static DEBUG_TURN_OFF_HANDPOSE: boolean = false;
	public static DEBUG_SHOW_FPS_COUNTER: boolean = true;
	public static AUTO_SKIP_CAMERA: boolean = true;
	public static SKIP_TO_MAIN_SCREEN: boolean = true;
	public static PAUSE_HAND_DETECTION: boolean = false;

	public static VIDEO_WIDTH: number = 640;
	public static VIDEO_HEIGHT: number = 480;
	public static VIDEO_WIDTH_CROP: number = Math.round(Globals.VIDEO_WIDTH / 1.6); // 400

	public static VIDEO_SETUP: boolean = false;

	public static SHOW_TURN_ON_WEBCAM: boolean = true;

	public static DOMCursor: DOMCursor;
	public static HAND_STATE_MANAGER: HandStateManager;
	public static MAIN;
	public static PRELOADER: Preloader;
	public static SETUP_VIDEO: SetupVideo;
	public static ACTIVE_STATE_CONTROLLER: ActiveStateController;

	public static FINGER_SPREAD: number = 0;
	public static FINGER_SPREAD_NEEDED_FOR_CLICK: number = 15;

	public static RIGHT_PALM_POINTING: boolean = false;

	public static ZOOMED_CANVAS: HTMLCanvasElement;

	public static HAND_ANALYZER: HandAnalyzer;
	public static USER_VIDEO_CONTAINER: HTMLDivElement;

	public static HAND_FOUND: boolean = false;

	public static VIDEO_DEFAULT_ALPHA: number = 0.3;

	public static STORE_SCROLL_PERCENTAGE_IN_MAIN_VIEW: number = 0.0;

	public static WIDTH_SCALE = 1;
	public static HEIGHT_SCALE = 1;

	public static IS_DRAGGING: boolean = false;

	public static COLOR_BLUE: string = '#3b76e8';
	public static COLOR_DARK_GREY: string = '#2b2b2b';

	public static ACTIVE_VIEW;

	public static VIEW_MANAGER: ViewManager;
}
