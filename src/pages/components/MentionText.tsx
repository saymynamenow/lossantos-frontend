import React from "react";
import { useNavigate } from "react-router-dom";

interface MentionTextProps {
  text: string;
  className?: string;
}

const MentionText: React.FC<MentionTextProps> = ({ text, className = "" }) => {
  const navigate = useNavigate();

  if (!text || typeof text !== "string") {
    return <span className={className}>{text || ""}</span>;
  }

  // Parse mentions from react-mentions markup format: @[username](username)
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Add the mention as a clickable link
    const displayName = match[1]; // Extract display name
    const username = match[2]; // Extract username

    parts.push(
      <span
        key={`mention-${match.index}`}
        className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/profile/${username}`);
        }}
      >
        @{displayName}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last mention
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <span className={className}>{parts.length > 0 ? parts : text}</span>;
};

export default MentionText;
