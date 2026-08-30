import type { SVGProps } from "react";

/**
 * Local provider marks. The project has no icon dependency, and pulling one in
 * for three glyphs is not worth it. Kept small (~18px) and optically even so the
 * social buttons stay visually neutral — see SocialAuthButtons.
 */

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden focusable="false" {...props}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function AppleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.99-.76.86-2.02 1.53-3.06 1.45-.13-1.1.44-2.26 1.1-3 .77-.86 2.13-1.5 3.08-1.44zM20.5 17.06c-.55 1.27-.82 1.84-1.53 2.96-.99 1.56-2.39 3.5-4.12 3.52-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.03-3.05-1.78-4.04-3.34-2.7-4.16-2.98-9.05-1.31-11.65 1.15-1.79 2.96-2.83 4.66-2.83 1.73 0 2.82 1 4.25 1 1.39 0 2.24-1 4.24-1 1.51 0 3.11.82 4.25 2.24-3.74 2.05-3.13 7.4.07 8.83z" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" {...props}>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.34l-.53 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}
