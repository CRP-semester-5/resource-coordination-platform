import { useEffect, useRef } from "react";

export function BackgroundShader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Balanced medium disaster relief color palette (Soft Emerald, Muted Teal, Gentle Cyan, Mint, Soft Indigo)
    const blobs = [
      {
        baseX: 0.2,
        baseY: 0.22,
        radius: 380,
        color: "rgba(16, 185, 129, 0.40)", // Balanced Emerald
        innerColor: "rgba(5, 150, 105, 0.50)",
        speedX: 0.0011,
        speedY: 0.0014,
        phase: 0,
      },
      {
        baseX: 0.8,
        baseY: 0.28,
        radius: 440,
        color: "rgba(13, 148, 136, 0.42)", // Deep Teal
        innerColor: "rgba(15, 118, 110, 0.52)",
        speedX: 0.0013,
        speedY: 0.0009,
        phase: Math.PI / 3,
      },
      {
        baseX: 0.5,
        baseY: 0.6,
        radius: 460,
        color: "rgba(6, 182, 212, 0.38)", // Cyan
        innerColor: "rgba(8, 145, 178, 0.46)",
        speedX: 0.0009,
        speedY: 0.0013,
        phase: Math.PI / 2,
      },
      {
        baseX: 0.15,
        baseY: 0.78,
        radius: 360,
        color: "rgba(52, 211, 153, 0.35)", // Mint
        innerColor: "rgba(16, 185, 129, 0.44)",
        speedX: 0.0015,
        speedY: 0.001,
        phase: Math.PI,
      },
      {
        baseX: 0.85,
        baseY: 0.75,
        radius: 400,
        color: "rgba(99, 102, 241, 0.30)", // Soft Indigo
        innerColor: "rgba(79, 70, 229, 0.40)",
        speedX: 0.0008,
        speedY: 0.0012,
        phase: (Math.PI * 3) / 2,
      },
      {
        baseX: 0.45,
        baseY: 0.15,
        radius: 320,
        color: "rgba(20, 184, 166, 0.34)", // Light Teal
        innerColor: "rgba(13, 148, 136, 0.44)",
        speedX: 0.0012,
        speedY: 0.0007,
        phase: Math.PI / 4,
      },
    ];

    let t = 0;

    const render = () => {
      t += 1;
      ctx.clearRect(0, 0, width, height);

      // Draw fluid gradient orbs with smooth sine undulation and soft color transitions
      blobs.forEach((blob) => {
        const currentX =
          width * blob.baseX + Math.sin(t * blob.speedX + blob.phase) * (width * 0.14);
        const currentY =
          height * blob.baseY + Math.cos(t * blob.speedY + blob.phase) * (height * 0.14);
        const currentRadius = blob.radius + Math.sin(t * 0.0025 + blob.phase) * 60;

        const gradient = ctx.createRadialGradient(
          currentX,
          currentY,
          0,
          currentX,
          currentY,
          Math.max(10, currentRadius),
        );

        gradient.addColorStop(0, blob.innerColor);
        gradient.addColorStop(0.45, blob.color);
        gradient.addColorStop(0.8, blob.color.replace(/[\d\.]+\)$/, "0.10)"));
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, Math.max(10, currentRadius), 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 1. Underlying Soft Ambient Atmospheric Tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-cyan-50/40 dark:from-emerald-950/25 dark:via-background dark:to-cyan-950/25" />

      {/* 2. Interactive High-Performance Canvas Fluid Mesh with smooth medium blur */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-60 blur-[56px] transform-gpu"
      />

      {/* 3. Subtle High-Tech Micro Dot Matrix Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-multiply dark:mix-blend-screen"
        style={{
          backgroundImage: "radial-gradient(rgba(13, 148, 136, 0.3) 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
