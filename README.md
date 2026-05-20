# Web Calculator

A responsive web calculator built with pure HTML, CSS, and JavaScript (no frameworks).

## Project structure

```text
Task_1_WebCalculator/
├── index.html
├── style.css
├── script.js
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── README.md
└── assets/
    ├── images/
    └── sounds/
```

## Implemented base requirements

- Display for input/output
- Numeric buttons `0-9`
- Operation buttons `+`, `-`, `x`, `÷`
- Extra buttons: `=`, `C`, `AC`, `.`, `+/-`
- Mobile-ready responsive layout
- Base arithmetic operations
- Correct operation order with precedence (`2 + 3 x 4 = 14`)
- Error handling (division by zero, incomplete and invalid expressions)
- Decimal numbers
- Sign toggle
- `C` for current entry clear, `AC` for full reset

## Optional improvements implemented

1. Percent (`%`)
2. Square root (`sqrt`)
3. Square (`x^2`)
4. Reciprocal (`1/x`)
5. Calculation history panel
6. Theme switch (light/dark)
7. Keyboard input support
8. Parentheses support
9. Active operator highlight
10. Button press animations

## Keyboard shortcuts

- Digits: `0-9`
- Operators: `+`, `-`, `*`, `/`
- Decimal: `.` or `,`
- Parentheses: `(` `)`
- Evaluate: `Enter` or `=`
- Clear all: `Esc`
- Clear current entry: `Delete`
- Delete one character: `Backspace`
- Percent: `%`
- Root: `r`
- Square: `s`
- Reciprocal: `i`
- Toggle sign: `n`

## Run locally without Docker

Open `index.html` directly in a browser, or run a local static server:

```bash
cd 'your/project/folder'
python -m http.server 8080
```

Then open: `http://localhost:8080`

## Run in Docker

### Option 1: docker compose

```bash
cd 'your/project/folder'
docker compose up --build -d
```

### Option 2: docker build + run

```bash
cd 'your/project/folder'
docker build -t web-calculator .
docker run --rm -p 8080:8080 web-calculator
```

Open: `http://localhost:8080`

## Browser support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
