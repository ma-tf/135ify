import { GitHubIcon } from "@components/github-icon";

export function Footer() {
  return (
    <footer className="flex items-center justify-center p-6 lg:p-8">
      <a
        href="https://github.com/ma-tf/135ify"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <GitHubIcon className="size-5" />
        <span className="sr-only">GitHub</span>
      </a>
    </footer>
  );
}
