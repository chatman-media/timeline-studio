import { motion } from "framer-motion"
import type React from "react"

interface Feature {
  icon: string
  title: string
  description: string
  examples: string[]
}

export const WhatYouCanDo: React.FC = () => {
  const features: Feature[] = [
    {
      icon: "🎬",
      title: "Professional Video Editing",
      description: "Full-featured timeline with all tools you need",
      examples: [
        "Multi-track timeline with unlimited layers",
        "Frame-accurate editing",
        "Multicam editing with angle switching",
        "Compound clips and nesting",
      ],
    },
    {
      icon: "🤖",
      title: "AI-Powered Automation",
      description: "100+ AI tools to speed up your workflow",
      examples: [
        "Auto scene detection and cutting",
        "Smart color grading",
        "Audio enhancement and noise removal",
        "Automatic subtitle generation",
      ],
    },
    {
      icon: "🎨",
      title: "Effects & Transitions",
      description: "Professional effects library",
      examples: [
        "100+ transitions (3D, glitch, cinematic)",
        "Color grading with LUTs",
        "Green screen / chroma key",
        "Speed ramping and time remapping",
      ],
    },
    {
      icon: "🎵",
      title: "Advanced Audio (Fairlight)",
      description: "Professional audio editing suite",
      examples: [
        "Multi-track audio mixing",
        "Surround sound support",
        "Audio effects and filters",
        "Voice enhancement and EQ",
      ],
    },
    {
      icon: "📤",
      title: "Export & Share",
      description: "Export to any format or platform",
      examples: [
        "4K/8K export without watermarks",
        "Direct upload to YouTube, TikTok, Vimeo",
        "Custom presets for social media",
        "Hardware-accelerated rendering",
      ],
    },
    {
      icon: "🔍",
      title: "Recognition & Analysis",
      description: "AI-powered scene understanding",
      examples: [
        "Face and object detection (YOLO)",
        "Emotion recognition",
        "Scene classification",
        "Quality analysis and scoring",
      ],
    },
  ]

  return (
    <section className="py-20 bg-[#12192C] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">
            What You Can <span className="text-gradient">Create</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need for professional video production
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-xl"
            >
              {/* Glassmorphism background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
              <div className="absolute inset-0 bg-white/[0.02]" />

              {/* Border gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
              </div>

              {/* Content */}
              <div className="relative p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.examples.map((example, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <svg
                        className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
