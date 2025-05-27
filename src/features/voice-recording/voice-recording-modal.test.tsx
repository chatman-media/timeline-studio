import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VoiceRecordModal } from "./voice-recording-modal";

// Мокаем хуки
vi.mock("./hooks/use-audio-permissions", () => ({
  useAudioPermissions: () => ({
    permissionStatus: "granted",
    errorMessage: "",
    requestPermissions: vi.fn().mockResolvedValue(true),
    setErrorMessage: vi.fn(),
  }),
}));

vi.mock("./hooks/use-audio-devices", () => ({
  useAudioDevices: () => ({
    audioDevices: [
      { deviceId: "device-1", label: "Microphone 1" },
      { deviceId: "device-2", label: "Microphone 2" },
    ],
    selectedAudioDevice: "device-1",
    setSelectedAudioDevice: vi.fn(),
    getDevices: vi.fn().mockResolvedValue(true),
  }),
}));

vi.mock("./hooks/use-voice-recording", () => ({
  useVoiceRecording: () => ({
    isRecording: false,
    showCountdown: false,
    recordingTime: 0,
    isDeviceReady: true,
    countdown: 3,
    setCountdown: vi.fn(),
    audioRef: { current: null },
    formatTime: (seconds: number) =>
      `00:${seconds.toString().padStart(2, "0")}`,
    stopRecording: vi.fn(),
    startCountdown: vi.fn(),
    initAudio: vi.fn(),
    cleanup: vi.fn(),
  }),
}));

// Мокаем i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("VoiceRecordModal", () => {
  it("renders the component", () => {
    const renderResult = render(<VoiceRecordModal isOpen onClose={() => {}} />);
    expect(renderResult.container.firstChild).not.toBeNull();
  });
});
