/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            scale: {
                102: "1.02",
            },
            animation: {
                bounce: "bounce 1s infinite",
                pulse: "pulse 2s infinite",
                spin: "spin 1s linear infinite",
            },
        },
    },
    plugins: [],
};
