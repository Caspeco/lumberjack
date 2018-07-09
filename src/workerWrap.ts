import Worker from "worker-loader!./worker.js";
import EventWorker from "event-worker";

const asyncWorker = new Worker();
export const worker1 = new EventWorker(asyncWorker);
