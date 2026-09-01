const ACTIVATION_API =
  "/.netlify/functions/activate";

function getDeviceId() {
  let deviceId = localStorage.getItem(
    "prototypeDeviceId"
  );

  if (!deviceId) {
    deviceId =
      crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) +
          Math.random().toString(36).substring(2);

    localStorage.setItem(
      "prototypeDeviceId",
      deviceId
    );
  }

  return deviceId;
}


function showStatus(message, type = "") {
  const status =
    document.getElementById(
      "prototype-lg-status"
    );

  if (!status) return;

  status.textContent = message;

  status.className =
    "prototype-lg-status";

  if (type) {
    status.classList.add(
      "prototype-lg-status-" + type
    );
  }
}


async function activateLicence() {

  const input =
    document.getElementById(
      "prototype-activation-code"
    );

  if (!input) return;

  const key =
    input.value.trim().toUpperCase();

  if (!key) {
    showStatus(
      "Please enter your activation code.",
      "error"
    );

    return;
  }


  showStatus(
    "Activating...",
    "busy"
  );


  try {

    const response =
      await fetch(
        ACTIVATION_API,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            key: key,
            deviceId: getDeviceId()
          })
        }
      );


    const data =
      await response.json();


    if (!data.success) {

      showStatus(
        data.message ||
        "Invalid activation code.",
        "error"
      );

      return;
    }


    /*
     * Save the successful activation
     * on this browser.
     */

    localStorage.setItem(
      "prototypeActivated",
      "true"
    );

    localStorage.setItem(
      "prototypeActivationToken",
      data.activationToken
    );


    showStatus(
      "Activation successful.",
      "ok"
    );


    /*
     * Hide the activation screen.
     */

    const gate =
      document.getElementById(
        "prototype-license-gate"
      );

    if (gate) {
      gate.classList.add("hidden");
    }


    /*
     * Show the rest of the application.
     *
     * This removes the hidden class from
     * the other application screen(s).
     */

    document
      .querySelectorAll(".screen")
      .forEach(screen => {

        if (
          screen.id !==
          "prototype-license-gate"
        ) {
          screen.classList.remove(
            "hidden"
          );
        }

      });

  } catch (error) {

    console.error(
      "Activation error:",
      error
    );

    showStatus(
      "Unable to contact the activation server.",
      "error"
    );
  }
}


/*
 * Check whether this browser was
 * previously activated.
 */

function checkExistingActivation() {

  const activated =
    localStorage.getItem(
      "prototypeActivated"
    );

  if (activated === "true") {

    const gate =
      document.getElementById(
        "prototype-license-gate"
      );

    if (gate) {
      gate.classList.add("hidden");
    }


    document
      .querySelectorAll(".screen")
      .forEach(screen => {

        if (
          screen.id !==
          "prototype-license-gate"
        ) {
          screen.classList.remove(
            "hidden"
          );
        }

      });
  }
}


/*
 * Start the licence system.
 */

window.addEventListener(
  "DOMContentLoaded",
  function () {

    const button =
      document.getElementById(
        "prototype-activate-button"
      );

    if (!button) {
      console.error(
        "Activation button not found."
      );

      return;
    }


    button.addEventListener(
      "click",
      activateLicence
    );


    checkExistingActivation();

  }
);