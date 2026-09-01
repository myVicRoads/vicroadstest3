const PROTOTYPE_CLIENT_ID =
  "70614982925-farpa9v52ocq877p9773rr2aul9h7im1.apps.googleusercontent.com";

const LICENCE_API =
  "https://script.google.com/macros/s/AKfycbysTgkd3v39s7ZbOcqIoxhCyQtT9mnL4eFMwbkqpc9Fpe5t7W7t7lHZ_DNqmxuo8Xxdqw/exec";


function getDeviceId() {

  let deviceId = localStorage.getItem("prototypeDeviceId");

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


function showStatus(message) {

  const status =
    document.getElementById("prototype-lg-status");

  if (status) {
    status.textContent = message;
  }
}


function startGoogleLogin() {

  if (
    !window.google ||
    !google.accounts ||
    !google.accounts.id
  ) {

    showStatus(
      "Google sign-in is still loading. Please try again."
    );

    return;
  }

  google.accounts.id.initialize({

    client_id: PROTOTYPE_CLIENT_ID,

    callback: handleGoogleResponse,

    auto_select: false

  });

  google.accounts.id.prompt();
}


async function handleGoogleResponse(response) {

  if (!response || !response.credential) {

    showStatus(
      "Google sign-in was not completed."
    );

    return;
  }


  try {

    /*
     * Read the Google ID token.
     */

    const parts =
      response.credential.split(".");

    const payload =
      JSON.parse(
        atob(
          parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")
        )
      );


    const email =
      payload.email || "";


    if (!email) {

      throw new Error(
        "Google account email was not received."
      );

    }


    /*
     * Get this browser's device ID.
     */

    const deviceId =
      getDeviceId();


    /*
     * Check whether this browser already
     * has a licence.
     */

    const existingEmail =
      localStorage.getItem(
        "prototypeGoogleAccount"
      );

    const existingKey =
      localStorage.getItem(
        "prototypeLicenceKey"
      );


    if (
      existingEmail === email &&
      existingKey
    ) {

      document.getElementById(
        "prototype-account-email"
      ).textContent = email;

      document.getElementById(
        "prototype-key-input"
      ).value = existingKey;

      document.getElementById(
        "prototype-google-step"
      ).classList.add("hidden");

      document.getElementById(
        "prototype-key-step"
      ).classList.remove("hidden");

      showStatus(
        "Your existing licence is active."
      );

      return;
    }


    /*
     * Don't allow a different Google account
     * to replace the account already stored
     * on this browser.
     */

    if (
      existingEmail &&
      existingEmail !== email
    ) {

      showStatus(
        "This device is already linked to another Google account."
      );

      return;
    }


    /*
     * Generate a new licence key.
     */

    const key =
      generateLicenceKey();


    /*
     * Send the account information
     * to your Google Sheet.
     */

    showStatus(
      "Creating your licence..."
    );


    const result =
      await fetch(
        LICENCE_API,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body: JSON.stringify({

            email: email,

            key: key,

            deviceId: deviceId

          })
        }
      );


    /*
     * Read the response from Apps Script.
     */

    const resultData =
      await result.json();


    /*
     * If the server rejected the
     * activation, stop here.
     */

    if (!resultData.success) {

      showStatus(
        resultData.message ||
        "Licence activation failed."
      );

      return;
    }


    /*
     * Save the account and key
     * on this browser.
     */

    localStorage.setItem(
      "prototypeGoogleAccount",
      email
    );

    localStorage.setItem(
      "prototypeLicenceKey",
      key
    );


    /*
     * Display the Google account.
     */

    document.getElementById(
      "prototype-account-email"
    ).textContent = email;


    /*
     * Display the licence key.
     */

    document.getElementById(
      "prototype-key-input"
    ).value = key;


    /*
     * Hide Google step.
     */

    document.getElementById(
      "prototype-google-step"
    ).classList.add("hidden");


    /*
     * Show licence-key step.
     */

    document.getElementById(
      "prototype-key-step"
    ).classList.remove("hidden");


    showStatus(
      "Licence activated successfully."
    );


  } catch (error) {

    console.error(
      "Licence activation error:",
      error
    );

    showStatus(
      "Unable to activate your licence. Please try again."
    );

  }
}


/*
 * Google button
 */

window.addEventListener(
  "load",
  function() {

    const button =
      document.getElementById(
        "prototype-google-login"
      );


    if (!button) {

      console.error(
        "Google login button not found."
      );

      return;
    }


    button.addEventListener(
      "click",
      function() {

        startGoogleLogin();

      }
    );

  }
);