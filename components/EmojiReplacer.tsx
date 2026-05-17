"use client";

import React from "react";
import {
  Leaf,
  User,
  Heart,
  Clock,
  MapPin,
  Bell,
  Sun,
  Moon,
  Smile,
  Settings,
} from "lucide-react";

const emojiMap: Record<string, JSX.Element> = {
  "🌱": <Leaf className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "🌿": <Leaf className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "😊": <Smile className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "🙂": <Smile className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "👤": <User className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "🧑": <User className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "❤️": <Heart className="inline w-4 h-4 align-text-bottom text-red-500" aria-hidden />,
  "❤": <Heart className="inline w-4 h-4 align-text-bottom text-red-500" aria-hidden />,
  "⏰": <Clock className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "🕒": <Clock className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "📍": <MapPin className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "🔔": <Bell className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "☀️": <Sun className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "🌙": <Moon className="inline w-4 h-4 align-text-bottom" aria-hidden />,
  "⚙️": <Settings className="inline w-4 h-4 align-text-bottom" aria-hidden />,
};

const emojiRegex = /\p{Extended_Pictographic}/u;

function processNode(node: any): React.ReactNode {
  if (node == null || typeof node === "boolean") return null;

  if (typeof node === "string") {
    // split by emoji while keeping them
    const parts = node.split(/(\p{Extended_Pictographic})/u).filter((p) => p !== "");
    if (parts.length === 1) return node;
    return parts.map((part, i) => {
      if (emojiRegex.test(part)) {
        const icon = emojiMap[part];
        return icon ? <span key={i} className="inline-flex items-center">{icon}</span> : part;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  }

  if (Array.isArray(node)) {
    return node.map((n, i) => <React.Fragment key={i}>{processNode(n)}</React.Fragment>);
  }

  if (React.isValidElement(node)) {
    const { props } = node as any;
    const skipTags = ["code", "pre", "svg", "img"];
    if (typeof node.type === "string" && skipTags.includes(node.type)) return node;

    // preserve element but process its children
    return React.cloneElement(node, { ...props }, processNode(props?.children));
  }

  return node;
}

export default function EmojiReplacer({ children }: { children: React.ReactNode }) {
  return <>{processNode(children)}</>;
}
