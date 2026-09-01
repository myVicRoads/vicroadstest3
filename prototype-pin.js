const DEMO_PIN = "123456";

let enteredPin = "";

const keypad = document.getElementById("keypad");
const dots = document.querySelectorAll("#pin-dots .dot");
const error = document.getElementById("pin-error");

keypad.addEventListener("click", function (event) {
  const key = event.target.closest(".key");

  if (!key) return;

  const value = key.dataset.key;

  if (value === "back") {
    enteredPin = enteredPin.slice(0, -1);
    error.textContent = "";
  }

  else if (value === "forgot") {
    error.textContent = "Demo PIN: 123456";
    return;
  }

  else if (enteredPin.length < 6) {
    enteredPin += value;
    error.textContent = "";
  }

  updateDots();

  if (enteredPin.length === 6) {
    checkPin();
  }
});

function updateDots() {
  dots.forEach((dot, index) => {
    dot.classList.toggle(
      "filled",
      index < enteredPin.length
    );
  });
}

function checkPin() {
  if (enteredPin === DEMO_PIN) {

    error.textContent = "";

    // Change this ID to the screen you want to open
    document.getElementById("pin-screen").classList.add("hidden");

    const nextScreen = document.getElementById("home-screen");

    if (nextScreen) {
      nextScreen.classList.remove("hidden");
    }

  } else {

    error.textContent = "Incorrect PIN";

    enteredPin = "";

    setTimeout(updateDots, 300);
  }
}