import psutil

from app.ai.suspicious_score import log_event

RECORDING_APPS = [
    "obs64.exe",
    "obs.exe",
    "bandicam.exe",
    "camtasia.exe",
    "snagit32.exe",
    "snagit64.exe",
    "sharex.exe",
    "screenrec.exe"
]


def check_screen_recording():
    detected = []

    for process in psutil.process_iter(["name"]):
        try:
            name = process.info["name"]

            if name and name.lower() in RECORDING_APPS:
                detected.append(name)

        except (psutil.NoSuchProcess,
                psutil.AccessDenied,
                psutil.ZombieProcess):
            pass

    if detected:
        for app in detected:
            log_event(f"Screen recording detected: {app}", 50)

        return detected

    return []

if __name__ == "__main__":

    apps = check_screen_recording()

    if apps:
        print("Recording software detected:")
        for app in apps:
            print(app)
    else:
        print("No recording software detected.")