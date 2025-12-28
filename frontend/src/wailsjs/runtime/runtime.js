// Wails Runtime Stub
// This file will be replaced by auto-generated runtime during wails dev/build

export function EventsOn(eventName, callback) {
  if (window.runtime) {
    window.runtime.EventsOn(eventName, callback);
  }
}

export function EventsOff(eventName) {
  if (window.runtime) {
    window.runtime.EventsOff(eventName);
  }
}

export function EventsEmit(eventName, ...data) {
  if (window.runtime) {
    window.runtime.EventsEmit(eventName, ...data);
  }
}

export function LogPrint(message) {
  console.log(message);
}

export function LogInfo(message) {
  console.info(message);
}

export function LogDebug(message) {
  console.debug(message);
}

export function LogWarning(message) {
  console.warn(message);
}

export function LogError(message) {
  console.error(message);
}

export function LogFatal(message) {
  console.error('FATAL:', message);
}
