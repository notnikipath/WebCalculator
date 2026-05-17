(() => {
  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const errorEl = document.getElementById("error");
  const historyListEl = document.getElementById("history-list");
  const clearHistoryEl = document.getElementById("clear-history");
  const themeToggleEl = document.getElementById("theme-toggle");

  if (!expressionEl || !resultEl || !errorEl || !historyListEl || !clearHistoryEl || !themeToggleEl) {
    return;
  }

  const THEME_STORAGE_KEY = "task1_calculator_theme";
  const OPERATORS = new Set(["+", "-", "*", "/"]);
  const PRECEDENCE = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const MAX_HISTORY_ITEMS = 20;

  const state = {
    tokens: [],
    currentInput: "",
    displayValue: "0",
    error: "",
    history: [],
    justEvaluated: false,
    lastExpression: "",
    theme: "light"
  };

  const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

  const isOperator = (token) => OPERATORS.has(token);

  const isNumberToken = (token) => {
    if (typeof token !== "string" || token.trim() === "") {
      return false;
    }

    const number = Number(token);
    return Number.isFinite(number);
  };

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) {
      throw new Error("Result is not finite.");
    }

    if (Object.is(value, -0)) {
      return "0";
    }

    const absolute = Math.abs(value);
    if ((absolute > 0 && absolute < 1e-10) || absolute >= 1e12) {
      return value.toExponential(8).replace(/\.0+e/, "e").replace(/(\.\d*?)0+e/, "$1e");
    }

    return Number(value.toFixed(10)).toString();
  };

  const prettifyToken = (token) => {
    if (token === "*") {
      return "x";
    }

    if (token === "/") {
      return "÷";
    }

    return token;
  };

  const prettifyExpression = (tokens) => tokens.map(prettifyToken).join(" ");

  const parenthesesBalanced = (tokens) => {
    let balance = 0;

    for (const token of tokens) {
      if (token === "(") {
        balance += 1;
      } else if (token === ")") {
        balance -= 1;
      }

      if (balance < 0) {
        return false;
      }
    }

    return balance === 0;
  };

  const countOpenParentheses = () => {
    let balance = 0;

    for (const token of state.tokens) {
      if (token === "(") {
        balance += 1;
      } else if (token === ")") {
        balance -= 1;
      }
    }

    return Math.max(balance, 0);
  };

  const parseInputAsNumber = (input) => {
    if (input === "") {
      return null;
    }

    if (input === "-" || input === "." || input === "-.") {
      return null;
    }

    const normalized = input.endsWith(".") ? input.slice(0, -1) : input;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  };

  const setError = (message) => {
    state.error = message;
    updateDisplay();
  };

  const clearError = () => {
    state.error = "";
  };

  const applyTheme = () => {
    document.body.dataset.theme = state.theme;
    themeToggleEl.textContent = `Theme: ${capitalize(state.theme)}`;
  };

  const loadTheme = () => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      state.theme = saved;
      return;
    }

    state.theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const updateOperatorHighlight = () => {
    const lastToken = state.tokens[state.tokens.length - 1];
    const operatorButtons = document.querySelectorAll(".key-operator");

    for (const button of operatorButtons) {
      button.classList.toggle("active-op", button.dataset.value === lastToken && state.currentInput === "");
    }
  };

  const updateDisplay = () => {
    const previewTokens = [...state.tokens];
    if (state.currentInput !== "") {
      previewTokens.push(state.currentInput);
    }

    const showLastExpression = state.justEvaluated && state.tokens.length === 0 && state.lastExpression;
    const previewText = showLastExpression
      ? state.lastExpression
      : previewTokens.length > 0
        ? prettifyExpression(previewTokens)
        : state.lastExpression;
    expressionEl.textContent = previewText || "\u00A0";

    let mainValue = state.displayValue;
    if (state.currentInput !== "") {
      mainValue = state.currentInput;
    } else {
      for (let index = state.tokens.length - 1; index >= 0; index -= 1) {
        const token = state.tokens[index];
        if (isNumberToken(token)) {
          mainValue = token;
          break;
        }
      }
    }
    resultEl.textContent = prettifyToken(mainValue || "0");

    if (state.error) {
      errorEl.hidden = false;
      errorEl.textContent = state.error;
    } else {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    updateOperatorHighlight();
  };

  const renderHistory = () => {
    historyListEl.innerHTML = "";

    if (state.history.length === 0) {
      const item = document.createElement("li");
      item.className = "history-empty";
      item.textContent = "No calculations yet.";
      historyListEl.append(item);
      return;
    }

    for (const record of state.history) {
      const listItem = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-item";
      button.dataset.result = record.result;

      const expressionLine = document.createElement("span");
      expressionLine.className = "history-expression";
      expressionLine.textContent = record.expression;

      const resultLine = document.createElement("span");
      resultLine.className = "history-result";
      resultLine.textContent = `= ${record.result}`;

      button.append(expressionLine, resultLine);
      listItem.append(button);
      historyListEl.append(listItem);
    }
  };

  const resetCalculator = () => {
    state.tokens = [];
    state.currentInput = "";
    state.displayValue = "0";
    state.error = "";
    state.justEvaluated = false;
    state.lastExpression = "";
    updateDisplay();
  };

  const allClear = () => {
    resetCalculator();
  };

  const clearEntry = () => {
    if (state.currentInput !== "") {
      state.currentInput = "";
    } else if (state.tokens.length > 0 && isNumberToken(state.tokens[state.tokens.length - 1])) {
      state.tokens.pop();
    } else {
      state.displayValue = "0";
    }

    state.justEvaluated = false;
    clearError();
    updateDisplay();
  };

  const backspace = () => {
    if (state.currentInput === "") {
      return;
    }

    state.currentInput = state.currentInput.slice(0, -1);
    if (state.currentInput === "-0") {
      state.currentInput = "-";
    }

    clearError();
    updateDisplay();
  };

  const prepareForNewNumberInput = () => {
    if (state.justEvaluated && state.tokens.length === 0) {
      state.tokens = [];
      state.currentInput = "";
      state.displayValue = "0";
      state.lastExpression = "";
      state.justEvaluated = false;
    }
  };

  const inputDigit = (digit) => {
    prepareForNewNumberInput();
    clearError();

    if (state.currentInput === "0") {
      state.currentInput = digit;
    } else if (state.currentInput === "-0") {
      state.currentInput = `-${digit}`;
    } else {
      state.currentInput += digit;
    }

    updateDisplay();
  };

  const inputDecimal = () => {
    prepareForNewNumberInput();
    clearError();

    if (state.currentInput.includes(".")) {
      return;
    }

    if (state.currentInput === "") {
      state.currentInput = "0.";
    } else if (state.currentInput === "-") {
      state.currentInput = "-0.";
    } else {
      state.currentInput += ".";
    }

    updateDisplay();
  };

  const commitCurrentInputToTokens = () => {
    if (state.currentInput === "") {
      return true;
    }

    const number = parseInputAsNumber(state.currentInput);
    if (number === null) {
      setError("Enter a valid number.");
      return false;
    }

    const formatted = formatNumber(number);
    state.tokens.push(formatted);
    state.displayValue = formatted;
    state.currentInput = "";
    return true;
  };

  const inputOperator = (operator) => {
    clearError();

    if (!commitCurrentInputToTokens()) {
      return;
    }

    if (state.tokens.length === 0) {
      if (operator === "-") {
        state.currentInput = "-";
        updateDisplay();
      }
      return;
    }

    const lastToken = state.tokens[state.tokens.length - 1];

    if (isOperator(lastToken)) {
      state.tokens[state.tokens.length - 1] = operator;
    } else if (lastToken === "(") {
      if (operator === "-") {
        state.currentInput = "-";
      }
    } else {
      state.tokens.push(operator);
    }

    state.justEvaluated = false;
    updateDisplay();
  };

  const inputLeftParen = () => {
    clearError();

    if (state.justEvaluated && state.tokens.length === 0) {
      state.currentInput = "";
      state.displayValue = "0";
      state.lastExpression = "";
      state.justEvaluated = false;
    }

    let insertedMultiply = false;
    if (state.currentInput !== "") {
      if (!commitCurrentInputToTokens()) {
        return;
      }
      state.tokens.push("*");
      insertedMultiply = true;
    }

    const lastToken = state.tokens[state.tokens.length - 1];
    if (!insertedMultiply && (isNumberToken(lastToken) || lastToken === ")")) {
      state.tokens.push("*");
    }

    state.tokens.push("(");
    updateDisplay();
  };

  const inputRightParen = () => {
    clearError();

    if (!commitCurrentInputToTokens()) {
      return;
    }

    const lastToken = state.tokens[state.tokens.length - 1];
    if (!lastToken || isOperator(lastToken) || lastToken === "(") {
      return;
    }

    if (countOpenParentheses() === 0) {
      return;
    }

    state.tokens.push(")");
    updateDisplay();
  };

  const toggleSign = () => {
    clearError();

    if (state.currentInput !== "") {
      state.currentInput = state.currentInput.startsWith("-") ? state.currentInput.slice(1) : `-${state.currentInput}`;
      updateDisplay();
      return;
    }

    const lastIndex = state.tokens.length - 1;
    if (lastIndex >= 0 && isNumberToken(state.tokens[lastIndex])) {
      state.tokens[lastIndex] = formatNumber(-Number(state.tokens[lastIndex]));
      updateDisplay();
      return;
    }

    if (state.displayValue !== "0") {
      state.currentInput = state.displayValue.startsWith("-") ? state.displayValue.slice(1) : `-${state.displayValue}`;
      state.justEvaluated = false;
      updateDisplay();
    }
  };

  const applyUnary = (transform) => {
    clearError();

    let source = "";
    let index = -1;
    let number = null;

    if (state.currentInput !== "") {
      number = parseInputAsNumber(state.currentInput);
      source = "input";
    } else if (state.tokens.length > 0 && isNumberToken(state.tokens[state.tokens.length - 1])) {
      index = state.tokens.length - 1;
      number = Number(state.tokens[index]);
      source = "token";
    } else {
      number = Number(state.displayValue);
      if (Number.isFinite(number)) {
        source = "display";
      }
    }

    if (!Number.isFinite(number)) {
      setError("Enter a number first.");
      return;
    }

    const transformed = transform(number);
    if (!Number.isFinite(transformed)) {
      setError("Math error.");
      return;
    }

    const formatted = formatNumber(transformed);

    if (source === "input") {
      state.currentInput = formatted;
    } else if (source === "token" && index >= 0) {
      state.tokens[index] = formatted;
    } else {
      state.tokens = [];
      state.currentInput = formatted;
    }

    state.displayValue = formatted;
    state.justEvaluated = false;
    updateDisplay();
  };

  const applyPercent = () => applyUnary((number) => number / 100);

  const applySqrt = () => {
    applyUnary((number) => {
      if (number < 0) {
        return Number.NaN;
      }
      return Math.sqrt(number);
    });
  };

  const applySquare = () => applyUnary((number) => number * number);

  const applyReciprocal = () => {
    applyUnary((number) => {
      if (number === 0) {
        return Number.NaN;
      }
      return 1 / number;
    });
  };

  const toRpn = (tokens) => {
    const output = [];
    const operators = [];

    for (const token of tokens) {
      if (isNumberToken(token)) {
        output.push(token);
      } else if (isOperator(token)) {
        while (operators.length > 0) {
          const top = operators[operators.length - 1];
          if (!isOperator(top) || PRECEDENCE[top] < PRECEDENCE[token]) {
            break;
          }
          output.push(operators.pop());
        }
        operators.push(token);
      } else if (token === "(") {
        operators.push(token);
      } else if (token === ")") {
        while (operators.length > 0 && operators[operators.length - 1] !== "(") {
          output.push(operators.pop());
        }

        if (operators.length === 0 || operators[operators.length - 1] !== "(") {
          throw new Error("Unmatched parentheses.");
        }

        operators.pop();
      } else {
        throw new Error("Unsupported token.");
      }
    }

    while (operators.length > 0) {
      const operator = operators.pop();
      if (operator === "(" || operator === ")") {
        throw new Error("Unmatched parentheses.");
      }
      output.push(operator);
    }

    return output;
  };

  const evalRpn = (rpnTokens) => {
    const stack = [];

    for (const token of rpnTokens) {
      if (isNumberToken(token)) {
        stack.push(Number(token));
        continue;
      }

      if (stack.length < 2) {
        throw new Error("Invalid expression.");
      }

      const right = stack.pop();
      const left = stack.pop();
      let next = 0;

      if (token === "+") {
        next = left + right;
      } else if (token === "-") {
        next = left - right;
      } else if (token === "*") {
        next = left * right;
      } else if (token === "/") {
        if (right === 0) {
          throw new Error("Division by zero.");
        }
        next = left / right;
      }

      stack.push(next);
    }

    if (stack.length !== 1) {
      throw new Error("Invalid expression.");
    }

    return stack[0];
  };

  const calculate = () => {
    clearError();

    const workingTokens = [...state.tokens];

    if (state.currentInput !== "") {
      const number = parseInputAsNumber(state.currentInput);
      if (number === null) {
        setError("Enter a valid number.");
        return;
      }
      workingTokens.push(formatNumber(number));
    }

    if (workingTokens.length === 0) {
      return;
    }

    const lastToken = workingTokens[workingTokens.length - 1];
    if (isOperator(lastToken) || lastToken === "(") {
      setError("Expression is incomplete.");
      return;
    }

    if (!parenthesesBalanced(workingTokens)) {
      setError("Check parentheses.");
      return;
    }

    try {
      const result = evalRpn(toRpn(workingTokens));
      const formattedResult = formatNumber(result);
      const expressionText = prettifyExpression(workingTokens);

      state.history.unshift({
        expression: expressionText,
        result: formattedResult
      });

      if (state.history.length > MAX_HISTORY_ITEMS) {
        state.history.pop();
      }

      state.tokens = [];
      state.currentInput = formattedResult;
      state.displayValue = formattedResult;
      state.justEvaluated = true;
      state.lastExpression = `${expressionText} =`;

      renderHistory();
      updateDisplay();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Calculation error.";
      if (message === "Division by zero.") {
        setError("Cannot divide by zero.");
      } else {
        setError("Invalid expression.");
      }
    }
  };

  const handleAction = (action, value = "") => {
    if (action === "digit") {
      inputDigit(value);
      return;
    }

    if (action === "decimal") {
      inputDecimal();
      return;
    }

    if (action === "operator") {
      inputOperator(value);
      return;
    }

    if (action === "equals") {
      calculate();
      return;
    }

    if (action === "clear") {
      clearEntry();
      return;
    }

    if (action === "allClear") {
      allClear();
      return;
    }

    if (action === "toggleSign") {
      toggleSign();
      return;
    }

    if (action === "percent") {
      applyPercent();
      return;
    }

    if (action === "sqrt") {
      applySqrt();
      return;
    }

    if (action === "square") {
      applySquare();
      return;
    }

    if (action === "reciprocal") {
      applyReciprocal();
      return;
    }

    if (action === "leftParen") {
      inputLeftParen();
      return;
    }

    if (action === "rightParen") {
      inputRightParen();
    }
  };

  const flashButton = (selector) => {
    const button = document.querySelector(selector);
    if (!button) {
      return;
    }

    button.classList.add("is-pressed");
    window.setTimeout(() => button.classList.remove("is-pressed"), 110);
  };

  const onKeyboard = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key;

    if (/^[0-9]$/.test(key)) {
      event.preventDefault();
      handleAction("digit", key);
      flashButton(`.key[data-action='digit'][data-value='${key}']`);
      return;
    }

    if (key === "." || key === ",") {
      event.preventDefault();
      handleAction("decimal");
      flashButton(".key[data-action='decimal']");
      return;
    }

    if (["+", "-", "*", "/"].includes(key)) {
      event.preventDefault();
      handleAction("operator", key);
      flashButton(`.key[data-action='operator'][data-value='${key}']`);
      return;
    }

    if (key === "Enter" || key === "=") {
      event.preventDefault();
      handleAction("equals");
      flashButton(".key[data-action='equals']");
      return;
    }

    if (key === "Escape") {
      event.preventDefault();
      handleAction("allClear");
      flashButton(".key[data-action='allClear']");
      return;
    }

    if (key === "Delete") {
      event.preventDefault();
      handleAction("clear");
      flashButton(".key[data-action='clear']");
      return;
    }

    if (key === "Backspace") {
      event.preventDefault();
      backspace();
      return;
    }

    if (key === "%") {
      event.preventDefault();
      handleAction("percent");
      flashButton(".key[data-action='percent']");
      return;
    }

    if (key === "(") {
      event.preventDefault();
      handleAction("leftParen");
      flashButton(".key[data-action='leftParen']");
      return;
    }

    if (key === ")") {
      event.preventDefault();
      handleAction("rightParen");
      flashButton(".key[data-action='rightParen']");
      return;
    }

    if (key.toLowerCase() === "r") {
      event.preventDefault();
      handleAction("sqrt");
      flashButton(".key[data-action='sqrt']");
      return;
    }

    if (key.toLowerCase() === "s") {
      event.preventDefault();
      handleAction("square");
      flashButton(".key[data-action='square']");
      return;
    }

    if (key.toLowerCase() === "i") {
      event.preventDefault();
      handleAction("reciprocal");
      flashButton(".key[data-action='reciprocal']");
      return;
    }

    if (key.toLowerCase() === "n") {
      event.preventDefault();
      handleAction("toggleSign");
      flashButton(".key[data-action='toggleSign']");
    }
  };

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const value = button.dataset.value || "";

    if (action) {
      handleAction(action, value);
    }
  });

  document.addEventListener("keydown", onKeyboard);

  historyListEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const historyButton = target.closest(".history-item");
    if (!(historyButton instanceof HTMLButtonElement)) {
      return;
    }

    const result = historyButton.dataset.result;
    if (!result) {
      return;
    }

    state.tokens = [];
    state.currentInput = result;
    state.displayValue = result;
    state.error = "";
    state.justEvaluated = true;
    updateDisplay();
  });

  clearHistoryEl.addEventListener("click", () => {
    state.history = [];
    renderHistory();
  });

  themeToggleEl.addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    window.localStorage.setItem(THEME_STORAGE_KEY, state.theme);
    applyTheme();
  });

  loadTheme();
  applyTheme();
  renderHistory();
  updateDisplay();
})();
