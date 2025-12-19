import type React from "react";

interface LogoProps {
  size?: "small" | "medium" | "large";
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = "medium",
  showText = true,
}) => {
  const sizes = {
    small: { circle: "w-10 h-10", text: "text-lg", font: 43 },
    medium: { circle: "w-12 h-12", text: "text-xl", font: 52 },
    large: { circle: "w-16 h-16", text: "text-2xl", font: "text-3xl" },
  };

  const currentSize = sizes[size];

  return (
    <div
      className="flex items-center shrink-0 w-auto max-w-full pr-2 md:pr-4"
      data-oid="ft4lv:3"
    >
      {/* Static circle with T */}
      <div
        className={`${currentSize.circle} shrink-0 mb-1 rounded-full flex items-center justify-center overflow-hidden`}
        style={{
          background: "#8b5cf6",
          boxShadow: "0 8px 32px 0 rgba(139, 92, 246, 0.4)",
          cursor: "pointer",
        }}
        data-oid="5omizpw"
      >
        <span
          className={"text-white"}
          style={{
            fontFamily: "Brush Script MT, Lucida Handwriting, cursive",
            fontWeight: "400",
            fontSize: currentSize.font,
            lineHeight: "1",
            transform: "translateX(-3px) translateY(2px)",
            cursor: "pointer",
          }}
          data-oid="lo2jk6e"
        >
          T
        </span>
      </div>
      {/* <img src="/favicon.svg" alt="Timeline Studio" className="w-12 h-12 mb-3" /> */}
      {/* Text */}
      {showText && (
        <div
          className="flex items-center space-x-2 -ml-3 mt-0.5 max-w-full overflow-hidden"
          data-oid="7ora01p"
        >
          <span
            className={`text-white ${currentSize.text} truncate whitespace-nowrap`}
            style={{
              fontFamily: "Brush Script MT, Lucida Handwriting, cursive",
              fontWeight: "400",
              fontSize: size === "small" ? 22 : 38,
            }}
            data-oid="p-iud-y"
          >
            imeline Studio
          </span>
          <span
            className="text-[10px] text-gray-500 font-medium px-1.5 ml-0.5 py-0.5 border border-gray-700 rounded-md shrink-0"
            data-oid="vfp3s_n"
          >
            BETA
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
