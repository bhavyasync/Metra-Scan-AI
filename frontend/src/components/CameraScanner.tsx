"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface CameraScannerProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraScanner({
  onCapture,
  onClose,
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const stopCamera = useCallback(() => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
      videoRef.current.onloadedmetadata = null;
      videoRef.current.srcObject = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (isMountedRef.current) {
        setError("Your browser does not support camera access.");
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          if (!videoRef.current || !isMountedRef.current) return;
          try {
            await videoRef.current.play();
            if (isMountedRef.current) {
              setReady(true);
            }
          } catch (playErr: any) {
            // Ignore AbortError when play() is canceled by a new load request or unmount
            if (playErr?.name === "AbortError") {
              return;
            }
            console.warn("Camera video play interrupted:", playErr);
          }
        };
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      if (err?.name === "AbortError") return;
      console.error("Camera access error:", err);
      setError("Camera access was blocked. Please allow camera permission and try again.");
    }
  }, [stopCamera]);

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !ready) {
      setError("Camera is not ready yet.");
      return;
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      setError("Unable to read camera frame.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setError("Unable to capture the image.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Failed to create image.");
          return;
        }

        const file = new File(
          [blob],
          `metrascan-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        stopCamera();
        onCapture(file);
      },
      "image/jpeg",
      0.94
    );
  }

  function closeCamera() {
    stopCamera();
    onClose();
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-[4/3] w-full object-cover"
        />

        {/* dark camera overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />

        {/* scanning frame */}
        {ready && (
          <>
            <div className="pointer-events-none absolute inset-[9%] rounded-[24px] border border-white/20" />

            <div className="pointer-events-none absolute left-[9%] right-[9%] top-[9%] h-[2px] overflow-hidden rounded-full bg-white/10">
              <div className="camera-scan-line h-full w-1/3 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
            </div>

            {/* corners */}
            <div className="pointer-events-none absolute left-[9%] top-[9%] h-8 w-8 border-l-2 border-t-2 border-white" />
            <div className="pointer-events-none absolute right-[9%] top-[9%] h-8 w-8 border-r-2 border-t-2 border-white" />
            <div className="pointer-events-none absolute bottom-[9%] left-[9%] h-8 w-8 border-b-2 border-l-2 border-white" />
            <div className="pointer-events-none absolute bottom-[9%] right-[9%] h-8 w-8 border-b-2 border-r-2 border-white" />

            <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-[11px] font-medium tracking-wide text-white backdrop-blur-md">
              ALIGN PACKAGE INSIDE FRAME
            </div>
          </>
        )}

        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="text-sm font-medium">Initializing camera</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-6">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-2xl text-red-400">
                !
              </div>
              <p className="text-sm leading-6 text-white/80">{error}</p>
            </div>
          </div>
        )}

        {ready && (
          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-[11px] text-white backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              Camera ready
            </div>

            <div className="rounded-full border border-white/15 bg-black/45 px-3 py-2 text-[11px] text-white/70 backdrop-blur-md">
              Rear camera preferred
            </div>
          </div>
        )}
      </div>

      {error && (
        <button
          type="button"
          onClick={startCamera}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Try Camera Again
        </button>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={capturePhoto}
          disabled={!ready}
          className="group flex-1 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-black transition hover:scale-[1.01] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span className="mr-2 inline-flex h-3 w-3 rounded-full border-[3px] border-black" />
          Capture Product
        </button>

        <button
          type="button"
          onClick={closeCamera}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-white/45">
        <div className="rounded-xl bg-white/[0.03] px-3 py-2">Keep steady</div>
        <div className="rounded-xl bg-white/[0.03] px-3 py-2">Avoid glare</div>
        <div className="rounded-xl bg-white/[0.03] px-3 py-2">Fill frame</div>
      </div>
    </div>
  );
}