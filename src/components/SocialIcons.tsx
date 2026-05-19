interface IconProps {
  className?: string;
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46L20 4" />
    </svg>
  );
}

export function BlueskyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566 1.184 1 2.18 1 4.633c0 .514.37 4.327.564 4.957.724 2.344 3.265 3.003 5.583 2.676C4.99 13.2 3.454 14.51 4.01 18.22c.745 4.964 5.74 3.136 7.99.437 2.25 2.7 7.245 4.527 7.99-.437.557-3.71-.98-5.02-3.137-5.954 2.318.327 4.86-.332 5.583-2.676.194-.63.564-4.443.564-4.957 0-2.453-1.566-3.45-4.202-1.828-2.752 1.942-5.71 5.88-6.798 7.995z" />
    </svg>
  );
}

export function MastodonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 480 511.476" fill="currentColor" className={className}>
      <path d="M396.545 174.981v136.53h-54.104V179.002c0-27.896-11.625-42.124-35.272-42.124-25.996 0-39.017 16.833-39.017 50.074v72.531h-53.777v-72.531c0-33.241-13.044-50.074-39.04-50.074-23.507 0-35.248 14.228-35.248 42.124v132.509H86.006v-136.53c0-27.896 7.123-50.059 21.366-66.488 14.695-16.387 33.97-24.803 57.896-24.803 27.691 0 48.617 10.647 62.568 31.917l13.464 22.597 13.484-22.597c13.951-21.27 34.877-31.917 62.521-31.917 23.902 0 43.177 8.416 57.919 24.803 14.231 16.414 21.336 38.577 21.321 66.488z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  );
}

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
