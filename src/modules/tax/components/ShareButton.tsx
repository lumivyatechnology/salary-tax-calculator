"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Share2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShareButtonProps {
  getUrl: () => string;
}

export function ShareButton({ getUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleCopy = async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: show input for manual copy
      setShowInput(true);
    }
  };

  const handleShare = async () => {
    const url = getUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tax Calculation",
          url,
        });
      } catch {
        // User cancelled or error
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (showInput) {
    return (
      <div className="flex gap-2">
        <Input
          value={getUrl()}
          readOnly
          className="text-xs"
          onFocus={(e) => e.target.select()}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInput(false)}
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share
              </>
            )}
          </Button>
        }
      />
      <TooltipContent>
        <p>Copy shareable link with current inputs</p>
      </TooltipContent>
    </Tooltip>
  );
}
