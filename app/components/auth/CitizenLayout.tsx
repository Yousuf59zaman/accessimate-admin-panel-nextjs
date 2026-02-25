"use client";

import React from "react";
import Link from "next/link";
import ApplicationLogo from "@/app/components/ui/ApplicationLogo";

interface CitizenLayoutProps {
  children: React.ReactNode;
}

export default function CitizenLayout({ children }: CitizenLayoutProps) {
  return (
    <div className="min-h-screen w-full flex">
      {/* Left Section (Form Container) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-8 flex justify-center animate-fade-in-up">
            <Link href="/">
              <ApplicationLogo width="200px" height="40px" />
            </Link>
          </div>

          {/* Form Content through children */}
          <div className="animate-fade-in-up-delayed">{children}</div>
        </div>
      </div>

      {/* Right Section (Background Image) */}
      <div className="hidden bg-linear-to-t from-white via-[#FAFCFF] cursor-pointer to-[#E6F4FF] lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating circles */}
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
          <div className="floating-circle circle-4"></div>

          {/* Gradient orbs */}
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>

        <div className="w-full h-full flex justify-center items-center relative z-10">
          {/* Main Background Image with animations */}
          <div className="image-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              src="/images/auth/background.png"
              alt="AccessiMate Background"
              className="main-image object-contain w-2/3 h-full cursor-pointer"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Basic fade in animations for left side */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }

        .animate-fade-in-up-delayed {
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        /* Main image animations */
        .image-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        .main-image {
          animation:
            float 6s ease-in-out infinite,
            fadeIn 1.5s ease-out;
          filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.1));
          transition: transform 0.3s ease;
        }

        .main-image:hover {
          transform: scale(1.02);
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Floating circles */
        .floating-circle {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.1),
            rgba(147, 197, 253, 0.05)
          );
          animation: floatCircle 8s ease-in-out infinite;
        }

        .circle-1 {
          width: 100px;
          height: 100px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .circle-2 {
          width: 60px;
          height: 60px;
          top: 20%;
          right: 15%;
          animation-delay: 2s;
        }

        .circle-3 {
          width: 80px;
          height: 80px;
          bottom: 30%;
          left: 5%;
          animation-delay: 4s;
        }

        .circle-4 {
          width: 120px;
          height: 120px;
          bottom: 10%;
          right: 10%;
          animation-delay: 6s;
        }

        @keyframes floatCircle {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-30px) rotate(120deg);
          }
          66% {
            transform: translateY(15px) rotate(240deg);
          }
        }

        /* Gradient orbs */
        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          animation: morphOrb 10s ease-in-out infinite;
        }

        .orb-1 {
          width: 200px;
          height: 200px;
          background: linear-gradient(
            45deg,
            rgba(59, 130, 246, 0.3),
            rgba(147, 197, 253, 0.2)
          );
          top: 15%;
          right: 20%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 150px;
          height: 150px;
          background: linear-gradient(
            45deg,
            rgba(147, 197, 253, 0.2),
            rgba(191, 219, 254, 0.1)
          );
          bottom: 25%;
          left: 15%;
          animation-delay: 5s;
        }

        @keyframes morphOrb {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            border-radius: 50%;
          }
          25% {
            transform: scale(1.2) rotate(90deg);
            border-radius: 60% 40% 60% 40%;
          }
          50% {
            transform: scale(0.8) rotate(180deg);
            border-radius: 40% 60% 40% 60%;
          }
          75% {
            transform: scale(1.1) rotate(270deg);
            border-radius: 50% 50% 50% 50%;
          }
        }

        /* Reduce animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .main-image,
          .floating-circle,
          .gradient-orb {
            animation: none;
          }

          .main-image {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
