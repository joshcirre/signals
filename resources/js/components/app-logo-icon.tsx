import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <rect
                x="1.5"
                y="1.5"
                width="37"
                height="37"
                rx="14"
                fill="url(#northstarGradient)"
            />
            <path
                d="M20 7.5L22.676 15.324L30.5 18L22.676 20.676L20 28.5L17.324 20.676L9.5 18L17.324 15.324L20 7.5Z"
                fill="white"
                fillOpacity="0.95"
            />
            <path
                d="M20 12.75L21.781 17.219L26.25 19L21.781 20.781L20 25.25L18.219 20.781L13.75 19L18.219 17.219L20 12.75Z"
                fill="#BFE7FF"
            />
            <path
                d="M11 30.25H29"
                stroke="rgba(255,255,255,0.42)"
                strokeLinecap="round"
            />
            <rect
                x="1.5"
                y="1.5"
                width="37"
                height="37"
                rx="14"
                stroke="rgba(255,255,255,0.18)"
            />
            <defs>
                <linearGradient
                    id="northstarGradient"
                    x1="6"
                    y1="3.5"
                    x2="31.5"
                    y2="36.5"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#112031" />
                    <stop offset="0.58" stopColor="#1D4ED8" />
                    <stop offset="1" stopColor="#7DD3FC" />
                </linearGradient>
            </defs>
        </svg>
    );
}
