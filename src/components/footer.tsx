import { GitHubIcon } from "@components/github-icon";
import { Button } from "@components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@components/ui/hover-card";

export function Footer() {
  return (
    <footer className="flex items-center justify-center gap-3 p-6 text-xs text-muted-foreground lg:p-8">
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger>
          <Button
            className="cursor-default underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
            variant="ghost"
          >
            Disclaimer
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-72 leading-relaxed lg:w-80">
          This is a hobby project built by a single person, not a company. Please use it sensibly. I
          make no guarantees about data retention, uptime, or the continued availability of this
          service.
        </HoverCardContent>
      </HoverCard>
      <a
        href="https://github.com/ma-tf/135ify"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-foreground"
      >
        <GitHubIcon className="size-5" />
        <span className="sr-only">GitHub</span>
      </a>
    </footer>
  );
}
