import sounddevice as sd
import numpy as np

from app.ai.suspicious_score import log_event

# Audio settings
THRESHOLD = 0.08       # Adjust if needed
DURATION = 1           # seconds
SAMPLE_RATE = 44100


def detect_audio():

    print("Audio monitoring started...")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:

            recording = sd.rec(
                int(DURATION * SAMPLE_RATE),
                samplerate=SAMPLE_RATE,
                channels=1,
                dtype="float32"
            )

            sd.wait()

            volume = np.linalg.norm(recording)

            print(f"Volume: {volume:.2f}")

            if volume > THRESHOLD:
                print("⚠ Loud sound detected!")

                log_event(
                    f"Loud sound detected (Volume: {volume:.2f})",
                    15
                )

    except KeyboardInterrupt:

        print("\nAudio monitoring stopped.")


if __name__ == "__main__":
    detect_audio()